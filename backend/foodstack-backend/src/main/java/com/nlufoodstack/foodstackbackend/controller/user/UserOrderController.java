package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.reponse.OrderItemResponse;
import com.nlufoodstack.foodstackbackend.dto.reponse.OrderResponse;
import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.OrderItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/orders")
@RequiredArgsConstructor
public class UserOrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getMyOrders(Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Bạn chưa đăng nhập"
                ));
            }

            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + authentication.getName()));

            List<OrderResponse> orders = orderRepository.findByUserOrderByCreatedAtDesc(user)
                    .stream()
                    .filter(this::isVisibleOrder)
                    .map(order -> toOrderResponse(order, false))
                    .toList();

            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi tải lịch sử đơn hàng",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Bạn chưa đăng nhập"
                ));
            }

            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + authentication.getName()));

            Order order = orderRepository.findByIdAndUser(id, user)
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
    private boolean isVisibleOrder(Order order) {
        boolean isFailedVnpay =
                "VNPAY".equalsIgnoreCase(order.paymentMethod)
                        && (
                        "FAILED".equalsIgnoreCase(order.paymentStatus)
                                || "CANCELLED".equalsIgnoreCase(order.status)
                                || "PENDING_PAYMENT".equalsIgnoreCase(order.status)
                );

        return !isFailedVnpay;
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
        response.setShippingName(order.shippingName);
        response.setShippingPhone(order.shippingPhone);
        response.setShippingAddress(order.shippingAddress);
        response.setNote(order.note);
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
}