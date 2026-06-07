package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.request.CheckoutRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.CheckoutResponse;
import com.nlufoodstack.foodstackbackend.entity.*;
import com.nlufoodstack.foodstackbackend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CheckoutService {

    private final CartItemRepository cartRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final PaymentTransactionRepository paymentRepo;
    private final VnpayService vnpayService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public CheckoutService(
            CartItemRepository cartRepo,
            OrderRepository orderRepo,
            OrderItemRepository orderItemRepo,
            PaymentTransactionRepository paymentRepo,
            VnpayService vnpayService
    ) {
        this.cartRepo = cartRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.paymentRepo = paymentRepo;
        this.vnpayService = vnpayService;
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
        BigDecimal totalAmount = subtotal.add(shippingFee);

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
        order.totalAmount = totalAmount;

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

        for (CartItem ci : cart) {
            FoodItem f = ci.getFoodItem();
            BigDecimal price = effectivePrice(f);

            OrderItem item = new OrderItem();
            item.order = order;
            item.foodItem = f;
            item.foodName = f.getName();
            item.foodImage = f.getImageUrl();
            item.unitPrice = price;
            item.quantity = ci.getQuantity();
            item.subtotal = price.multiply(BigDecimal.valueOf(ci.getQuantity()));
            item.note = ci.getNote();

            orderItemRepo.save(item);
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
            cartRepo.deleteAll(cart);
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

    private BigDecimal effectivePrice(FoodItem f) {
        return f.getDiscountPrice() != null
                ? f.getDiscountPrice()
                : f.getPrice();
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

    private String toJson(Map<String, String> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return "{}";
        }
    }
}