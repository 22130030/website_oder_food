package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.request.CheckoutRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.CheckoutResponse;
import com.nlufoodstack.foodstackbackend.entity.CartItem;
import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import com.nlufoodstack.foodstackbackend.entity.PaymentTransaction;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.entity.Voucher;
import com.nlufoodstack.foodstackbackend.repository.CartItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderRepository;
import com.nlufoodstack.foodstackbackend.repository.PaymentTransactionRepository;
import com.nlufoodstack.foodstackbackend.repository.VoucherRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CheckoutService {

    private final CartItemRepository cartRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final PaymentTransactionRepository paymentRepo;
    private final VnpayService vnpayService;
    private final VoucherRepository voucherRepository;
    private final EmailService emailService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public CheckoutService(
            CartItemRepository cartRepo,
            OrderRepository orderRepo,
            OrderItemRepository orderItemRepo,
            PaymentTransactionRepository paymentRepo,
            VnpayService vnpayService,
            VoucherRepository voucherRepository,
            EmailService emailService
    ) {
        this.cartRepo = cartRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.paymentRepo = paymentRepo;
        this.vnpayService = vnpayService;
        this.voucherRepository = voucherRepository;
        this.emailService = emailService;
    }

    @Transactional
    public CheckoutResponse checkout(
            User user,
            CheckoutRequest req,
            HttpServletRequest servletRequest
    ) {
        List<CartItem> cart = cartRepo.findByUserId(user.getId());

        if (cart.isEmpty()) {
            throw new RuntimeException("Giỏ hàng đang trống");
        }

        String method = "VNPAY".equalsIgnoreCase(req.paymentMethod)
                ? "VNPAY"
                : "COD";

        BigDecimal subtotal = cart.stream()
                .map(ci -> effectivePrice(ci.getFoodItem())
                        .multiply(BigDecimal.valueOf(ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = calculateShippingFee(subtotal);

        Voucher voucher = getValidVoucher(req.getVoucherCode(), subtotal);

        BigDecimal discountAmount = calculateVoucherDiscount(voucher, subtotal);

        BigDecimal totalAmount = subtotal
                .add(shippingFee)
                .subtract(discountAmount);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        Order order = new Order();
        order.orderCode = "FS" + System.currentTimeMillis();
        order.user = user;

        order.shippingName = req.shippingName;
        order.shippingPhone = req.shippingPhone;
        order.shippingAddress = req.shippingAddress;
        order.shippingLat = req.shippingLat;
        order.shippingLng = req.shippingLng;
        order.shippingPlaceId = req.shippingPlaceId;
        order.shippingDistanceKm = req.shippingDistanceKm;

        order.subtotal = subtotal;
        order.shippingFee = shippingFee;
        order.discountAmount = discountAmount;
        order.totalAmount = totalAmount;
        order.voucherCode = voucher == null ? null : voucher.getCode();

        order.paymentMethod = method;
        order.note = req.note;

        if ("VNPAY".equals(method)) {
            order.status = "PENDING_PAYMENT";
            order.paymentStatus = "PENDING";
        } else {
            order.status = "PENDING";
            order.paymentStatus = "UNPAID";
        }

        order.createdAt = LocalDateTime.now();
        order.updatedAt = LocalDateTime.now();

        order = orderRepo.save(order);

        List<OrderItem> createdOrderItems = new ArrayList<>();

        for (CartItem ci : cart) {
            FoodItem food = ci.getFoodItem();
            BigDecimal price = effectivePrice(food);

            OrderItem item = new OrderItem();
            item.order = order;
            item.foodItem = food;
            item.foodName = food.getName();
            item.foodImage = food.getImageUrl();
            item.unitPrice = price;
            item.quantity = ci.getQuantity();
            item.subtotal = price.multiply(BigDecimal.valueOf(ci.getQuantity()));
            item.note = ci.getNote();

            createdOrderItems.add(orderItemRepo.save(item));
        }

        PaymentTransaction tx = new PaymentTransaction();
        tx.order = order;
        tx.paymentMethod = method;
        tx.amount = order.totalAmount;
        tx.vnpayTxnRef = order.orderCode;
        tx.status = "PENDING";
        tx.createdAt = LocalDateTime.now();
        tx.updatedAt = LocalDateTime.now();

        paymentRepo.save(tx);

        String paymentUrl = null;

        if ("VNPAY".equals(method)) {
            paymentUrl = vnpayService.createPaymentUrl(order, servletRequest);
        } else {
            increaseVoucherUsedCount(order.voucherCode);
            cartRepo.deleteAll(cart);
            emailService.sendOrderConfirmation(order, createdOrderItems);
        }

        return new CheckoutResponse(
                order.id,
                order.orderCode,
                order.totalAmount,
                method,
                order.paymentStatus,
                paymentUrl
        );
    }

    @Transactional
    public void handleVnpayReturn(Map<String, String> params) {
        if (!vnpayService.verifyReturn(params)) {
            throw new RuntimeException("Sai chữ ký VNPAY");
        }

        String txnRef = params.get("vnp_TxnRef");

        PaymentTransaction tx = paymentRepo.findByVnpayTxnRefWithOrderAndUser(txnRef)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        Order order = tx.order;

        boolean success =
                "00".equals(params.get("vnp_ResponseCode"))
                        && "00".equals(params.get("vnp_TransactionStatus"));

        boolean wasAlreadySuccess = "SUCCESS".equalsIgnoreCase(tx.status);

        tx.gatewayTransactionNo = params.get("vnp_TransactionNo");
        tx.bankCode = params.get("vnp_BankCode");
        tx.payDate = params.get("vnp_PayDate");
        tx.responseCode = params.get("vnp_ResponseCode");
        tx.rawResponse = toJson(params);
        tx.updatedAt = LocalDateTime.now();


        if (success) {
            tx.status = "SUCCESS";

            order.status = "PENDING";
            order.paymentStatus = "PAID";
            order.cancelReason = null;

            if (!wasAlreadySuccess) {
                increaseVoucherUsedCount(order.voucherCode);
                emailService.sendOrderConfirmation(order, orderItemRepo.findByOrder(order));
            }

            Long userId = paymentRepo.findUserIdByVnpayTxnRef(txnRef)
                    .orElse(null);

            if (userId != null) {
                cartRepo.deleteByUserId(userId);
            }
        } else {
            tx.status = "FAILED";

            order.status = "CANCELLED";
            order.paymentStatus = "FAILED";
            order.cancelReason = "Thanh toán VNPay không thành công hoặc khách đã hủy thanh toán";
        }

        order.updatedAt = LocalDateTime.now();

        paymentRepo.save(tx);
        orderRepo.save(order);
    }

    private BigDecimal effectivePrice(FoodItem food) {
        if (food == null) {
            return BigDecimal.ZERO;
        }

        if (food.getDiscountPrice() != null) {
            return food.getDiscountPrice();
        }

        if (food.getPrice() != null) {
            return food.getPrice();
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal calculateShippingFee(BigDecimal subtotal) {
        if (subtotal == null) {
            return BigDecimal.valueOf(20000);
        }

        if (subtotal.compareTo(BigDecimal.valueOf(200000)) >= 0) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(20000);
    }

    private Voucher getValidVoucher(String voucherCode, BigDecimal subtotal) {
        if (voucherCode == null || voucherCode.trim().isBlank()) {
            return null;
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(normalizeVoucherCode(voucherCode))
                .orElseThrow(() -> new RuntimeException("Mã voucher không tồn tại"));

        validateVoucher(voucher, subtotal);

        return voucher;
    }

    private void validateVoucher(Voucher voucher, BigDecimal subtotal) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getActive())) {
            throw new RuntimeException("Voucher đã bị tạm tắt");
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Voucher chưa đến thời gian sử dụng");
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Voucher đã hết hạn");
        }

        int quantity = voucher.getQuantity() == null ? 0 : voucher.getQuantity();
        int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();

        if (usedCount >= quantity) {
            throw new RuntimeException("Voucher đã hết lượt sử dụng");
        }

        BigDecimal minOrderAmount = money(voucher.getMinOrderAmount());

        if (subtotal.compareTo(minOrderAmount) < 0) {
            throw new RuntimeException(
                    "Đơn hàng cần tối thiểu " +
                            minOrderAmount.setScale(0, RoundingMode.HALF_UP).toPlainString() +
                            "đ để dùng voucher này"
            );
        }
    }

    private BigDecimal calculateVoucherDiscount(Voucher voucher, BigDecimal subtotal) {
        if (voucher == null) {
            return BigDecimal.ZERO;
        }

        String type = voucher.getDiscountType() == null
                ? ""
                : voucher.getDiscountType().toUpperCase(Locale.ROOT);

        BigDecimal discountValue = money(voucher.getDiscountValue());

        if ("PERCENT".equals(type)) {
            BigDecimal discount = subtotal
                    .multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal maxDiscount = money(voucher.getMaxDiscountAmount());

            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0
                    && discount.compareTo(maxDiscount) > 0) {
                return maxDiscount;
            }

            return discount;
        }

        if ("FIXED".equals(type)) {
            return discountValue.min(subtotal);
        }

        return BigDecimal.ZERO;
    }

    private void increaseVoucherUsedCount(String voucherCode) {
        if (voucherCode == null || voucherCode.trim().isBlank()) {
            return;
        }

        voucherRepository.findByCodeIgnoreCase(normalizeVoucherCode(voucherCode))
                .ifPresent(voucher -> {
                    int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
                    voucher.setUsedCount(usedCount + 1);
                    voucherRepository.save(voucher);
                });
    }

    private String normalizeVoucherCode(String code) {
        return code == null
                ? ""
                : code.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String toJson(Map<String, String> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return "{}";
        }
    }
}