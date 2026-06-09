package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.dto.reponse.OrderItemResponse;
import com.nlufoodstack.foodstackbackend.dto.reponse.OrderResponse;
import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import com.nlufoodstack.foodstackbackend.repository.OrderItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "PENDING",
            "PENDING_PAYMENT",
            "PREPARING",
            "DELIVERING",
            "COMPLETED",
            "CANCELLED"
    );

    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword
    ) {
        try {
            String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
            String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

            List<OrderResponse> orders = orderRepository.findAllByOrderByCreatedAtDesc()
                    .stream()
                    .filter(order -> {
                        if (normalizedStatus.isBlank() || "ALL".equals(normalizedStatus)) {
                            return true;
                        }

                        return normalizedStatus.equalsIgnoreCase(order.status);
                    })
                    .filter(order -> {
                        if (normalizedKeyword.isBlank()) {
                            return true;
                        }

                        String id = order.id == null ? "" : String.valueOf(order.id);
                        String code = safe(order.orderCode);
                        String name = safe(order.shippingName);
                        String phone = safe(order.shippingPhone);
                        String address = safe(order.shippingAddress);
                        String paymentMethod = safe(order.paymentMethod);
                        String paymentStatus = safe(order.paymentStatus);

                        return id.contains(normalizedKeyword)
                                || code.toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                                || name.toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                                || phone.toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                                || address.toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                                || paymentMethod.toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                                || paymentStatus.toLowerCase(Locale.ROOT).contains(normalizedKeyword);
                    })
                    .map(order -> toOrderResponse(order, false))
                    .toList();

            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi tải danh sách đơn hàng",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

            return ResponseEntity.ok(toOrderResponse(order, true));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi xem chi tiết đơn hàng",
                    "error", e.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String newStatus = body.getOrDefault("status", "").trim().toUpperCase(Locale.ROOT);
            String cancelReason = body.getOrDefault("cancelReason", "").trim();

            if (!VALID_STATUSES.contains(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Trạng thái đơn hàng không hợp lệ"
                ));
            }

            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

            order.status = newStatus;
            order.updatedAt = LocalDateTime.now();

            if ("CANCELLED".equals(newStatus)) {
                order.cancelReason = cancelReason.isBlank()
                        ? "Admin đã hủy đơn hàng"
                        : cancelReason;

                if (!"PAID".equalsIgnoreCase(order.paymentStatus)) {
                    order.paymentStatus = "FAILED";
                }
            } else {
                order.cancelReason = null;
            }

            if ("COMPLETED".equals(newStatus)) {
                order.paymentStatus = "PAID";
            }

            Order saved = orderRepository.save(order);

            return ResponseEntity.ok(toOrderResponse(saved, true));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi cập nhật trạng thái đơn hàng",
                    "error", e.getMessage()
            ));
        }
    }

    private OrderResponse toOrderResponse(Order order, boolean includeItems) {
        OrderResponse response = new OrderResponse();

        response.setId(order.id);
        response.setOrderCode(order.orderCode);
        response.setStatus(order.status);
        response.setPaymentMethod(order.paymentMethod);
        response.setPaymentStatus(order.paymentStatus);

        response.setSubtotal(order.subtotal);
        response.setShippingFee(order.shippingFee);
        response.setTotalAmount(order.totalAmount);

        if (order.user != null) {
            response.setUserId(order.user.getId());
            response.setCustomerEmail(order.user.getEmail());
        }

        response.setShippingName(order.shippingName);
        response.setShippingPhone(order.shippingPhone);
        response.setShippingAddress(order.shippingAddress);
        response.setShippingLat(order.shippingLat);
        response.setShippingLng(order.shippingLng);
        response.setShippingPlaceId(order.shippingPlaceId);
        response.setShippingDistanceKm(order.shippingDistanceKm);

        response.setNote(order.note);
        response.setVoucherCode(order.voucherCode);
        response.setDiscountAmount(order.discountAmount);
        response.setCancelReason(order.cancelReason);
        response.setCreatedAt(order.createdAt);
        response.setUpdatedAt(order.updatedAt);

        if (includeItems) {
            List<OrderItemResponse> items = orderItemRepository.findByOrder(order)
                    .stream()
                    .map(this::toOrderItemResponse)
                    .toList();

            response.setItems(items);
        }

        return response;
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        OrderItemResponse response = new OrderItemResponse();

        response.setId(item.id);

        if (item.foodItem != null) {
            response.setFoodItemId(item.foodItem.getId());
        }

        response.setFoodName(item.foodName);
        response.setFoodImage(item.foodImage);
        response.setQuantity(item.quantity);
        response.setUnitPrice(item.unitPrice);
        response.setSubtotal(item.subtotal);
        response.setNote(item.note);

        return response;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}