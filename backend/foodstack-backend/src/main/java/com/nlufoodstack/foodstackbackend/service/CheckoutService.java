package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.request.CheckoutRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.CheckoutResponse;
import com.nlufoodstack.foodstackbackend.entity.*;
import com.nlufoodstack.foodstackbackend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CheckoutService {
    private final CartItemRepository cartRepo; private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo; private final PaymentTransactionRepository paymentRepo;
    private final VnpayService vnpayService;
    public CheckoutService(CartItemRepository cartRepo, OrderRepository orderRepo, OrderItemRepository orderItemRepo, PaymentTransactionRepository paymentRepo, VnpayService vnpayService) {
        this.cartRepo = cartRepo; this.orderRepo = orderRepo; this.orderItemRepo = orderItemRepo; this.paymentRepo = paymentRepo; this.vnpayService = vnpayService;
    }

    @Transactional
    public CheckoutResponse checkout(User user, CheckoutRequest req, HttpServletRequest servletRequest) {
        List<CartItem> cart = cartRepo.findByUserId(user.getId());
        if (cart.isEmpty()) throw new RuntimeException("Giỏ hàng đang trống");
        String method = "VNPAY".equalsIgnoreCase(req.paymentMethod) ? "VNPAY" : "COD";
        BigDecimal subtotal = cart.stream().map(ci -> effectivePrice(ci.getFoodItem()).multiply(BigDecimal.valueOf(ci.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shippingFee = calculateShippingFee(req.shippingDistanceKm);
        Order order = new Order();
        order.orderCode = "FS" + System.currentTimeMillis(); order.user = user;
        order.shippingName = req.shippingName; order.shippingPhone = req.shippingPhone; order.shippingAddress = req.shippingAddress;
        order.shippingLat = req.shippingLat; order.shippingLng = req.shippingLng; order.shippingPlaceId = req.shippingPlaceId; order.shippingDistanceKm = req.shippingDistanceKm;
        order.subtotal = subtotal; order.shippingFee = shippingFee; order.totalAmount = subtotal.add(shippingFee);
        order.paymentMethod = method; order.paymentStatus = method.equals("COD") ? "UNPAID" : "UNPAID"; order.note = req.note;
        order = orderRepo.save(order);
        for (CartItem ci : cart) {
            FoodItem f = ci.getFoodItem(); BigDecimal price = effectivePrice(f);
            OrderItem item = new OrderItem(); item.order = order; item.foodItem = f; item.foodName = f.getName(); item.foodImage = f.getImageUrl();
            item.unitPrice = price; item.quantity = ci.getQuantity(); item.subtotal = price.multiply(BigDecimal.valueOf(ci.getQuantity())); item.note = ci.getNote();
            orderItemRepo.save(item);
        }
        PaymentTransaction tx = new PaymentTransaction(); tx.order = order; tx.paymentMethod = method; tx.amount = order.totalAmount; tx.vnpayTxnRef = order.orderCode; tx.status = method.equals("COD") ? "PENDING" : "PENDING";
        paymentRepo.save(tx);
        cartRepo.deleteAll(cart);
        String paymentUrl = method.equals("VNPAY") ? vnpayService.createPaymentUrl(order, servletRequest) : null;
        return new CheckoutResponse(order.id, order.orderCode, order.totalAmount, method, order.paymentStatus, paymentUrl);
    }

    @Transactional
    public void handleVnpayReturn(Map<String, String> params) {
        if (!vnpayService.verifyReturn(params)) throw new RuntimeException("Sai chữ ký VNPAY");
        String txnRef = params.get("vnp_TxnRef");
        PaymentTransaction tx = paymentRepo.findByVnpayTxnRef(txnRef).orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
        Order order = tx.order;
        boolean success = "00".equals(params.get("vnp_ResponseCode")) && "00".equals(params.get("vnp_TransactionStatus"));
        tx.status = success ? "SUCCESS" : "FAILED"; tx.gatewayTransactionNo = params.get("vnp_TransactionNo"); tx.bankCode = params.get("vnp_BankCode"); tx.payDate = params.get("vnp_PayDate"); tx.responseCode = params.get("vnp_ResponseCode"); tx.rawResponse = params.toString(); tx.updatedAt = LocalDateTime.now();
        order.paymentStatus = success ? "PAID" : "UNPAID"; order.updatedAt = LocalDateTime.now();
        paymentRepo.save(tx); orderRepo.save(order);
    }

    private BigDecimal effectivePrice(FoodItem f) { return f.getDiscountPrice() != null ? f.getDiscountPrice() : f.getPrice(); }
    private BigDecimal calculateShippingFee(BigDecimal km) { if (km == null) return BigDecimal.valueOf(15000); return BigDecimal.valueOf(15000).add(km.multiply(BigDecimal.valueOf(3000))); }
}
