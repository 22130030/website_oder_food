package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.FoodItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderItemRepository;
import com.nlufoodstack.foodstackbackend.repository.OrderRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/dashboard/overview")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        List<Order> orders = orderRepository.findAll();
        List<OrderItem> orderItems = orderItemRepository.findAll();
        List<FoodItem> foods = foodItemRepository.findAll();
        List<User> users = userRepository.findAll();

        LocalDate today = LocalDate.now();

        LocalDateTime startToday = today.atStartOfDay();
        LocalDateTime startTomorrow = startToday.plusDays(1);
        LocalDateTime startYesterday = startToday.minusDays(1);

        BigDecimal revenueToday = sumCompletedRevenue(orders, startToday, startTomorrow);
        BigDecimal revenueYesterday = sumCompletedRevenue(orders, startYesterday, startToday);

        long ordersToday = orders.stream()
                .filter(this::isVisibleOrder)
                .filter(order -> inRange(order.createdAt, startToday, startTomorrow))
                .count();

        long ordersYesterday = orders.stream()
                .filter(this::isVisibleOrder)
                .filter(order -> inRange(order.createdAt, startYesterday, startToday))
                .count();

        long newCustomersToday = users.stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .filter(user -> inRange(user.getCreatedAt(), startToday, startTomorrow))
                .count();

        long newCustomersYesterday = users.stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .filter(user -> inRange(user.getCreatedAt(), startYesterday, startToday))
                .count();

        long availableFoods = foods.stream()
                .filter(food -> Boolean.TRUE.equals(food.getIsAvailable()))
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("revenueToday", revenueToday);
        summary.put("revenueChange", revenueToday.subtract(revenueYesterday));
        summary.put("ordersToday", ordersToday);
        summary.put("ordersChange", ordersToday - ordersYesterday);
        summary.put("newCustomersToday", newCustomersToday);
        summary.put("newCustomersChange", newCustomersToday - newCustomersYesterday);
        summary.put("availableFoods", availableFoods);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("summary", summary);
        response.put("recentOrders", buildRecentOrders(orders));
        response.put("topFoods", buildTopFoods(orderItems));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> buildRecentOrders(List<Order> orders) {
        return orders.stream()
                .filter(this::isVisibleOrder)
                .sorted(Comparator.comparing(
                        (Order order) -> order.createdAt == null
                                ? LocalDateTime.MIN
                                : order.createdAt
                ).reversed())
                .limit(5)
                .map(order -> {
                    Map<String, Object> row = new LinkedHashMap<>();

                    row.put("id", order.id);
                    row.put("orderCode", order.orderCode);
                    row.put("customer", getCustomerName(order));
                    row.put("items", buildItemsSummary(order));
                    row.put("total", money(order.totalAmount));
                    row.put("status", normalizeStatus(order.status));
                    row.put("createdAt", order.createdAt);
                    row.put("timeAgo", timeAgo(order.createdAt));

                    return row;
                })
                .toList();
    }

    private List<Map<String, Object>> buildTopFoods(List<OrderItem> orderItems) {
        Map<String, FoodAgg> map = new LinkedHashMap<>();

        for (OrderItem item : orderItems) {
            if (item == null || item.order == null || !isCompleted(item.order)) {
                continue;
            }

            String foodName = item.foodName;

            if ((foodName == null || foodName.isBlank()) && item.foodItem != null) {
                foodName = item.foodItem.getName();
            }

            if (foodName == null || foodName.isBlank()) {
                foodName = "Món ăn";
            }

            int quantity = item.quantity == null ? 0 : item.quantity;

            BigDecimal revenue = item.subtotal;

            if (revenue == null) {
                revenue = money(item.unitPrice).multiply(BigDecimal.valueOf(quantity));
            }

            FoodAgg agg = map.computeIfAbsent(foodName, FoodAgg::new);
            agg.sold += quantity;
            agg.revenue = agg.revenue.add(revenue);
        }

        return map.values()
                .stream()
                .sorted(
                        Comparator.comparingLong((FoodAgg item) -> item.sold)
                                .reversed()
                                .thenComparing(item -> item.name)
                )
                .limit(5)
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();

                    row.put("name", item.name);
                    row.put("sold", item.sold);
                    row.put("revenue", item.revenue);

                    return row;
                })
                .toList();
    }

    private String buildItemsSummary(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrder(order);

        if (items == null || items.isEmpty()) {
            return "Chưa có món";
        }

        List<String> names = new ArrayList<>();

        for (OrderItem item : items) {
            String name = item.foodName;

            if ((name == null || name.isBlank()) && item.foodItem != null) {
                name = item.foodItem.getName();
            }

            if (name == null || name.isBlank()) {
                name = "Món ăn";
            }

            int quantity = item.quantity == null ? 1 : item.quantity;

            names.add(name + " x" + quantity);
        }

        if (names.size() <= 2) {
            return String.join(", ", names);
        }

        return names.get(0) + ", " + names.get(1) + " +" + (names.size() - 2) + " món";
    }

    private BigDecimal sumCompletedRevenue(
            List<Order> orders,
            LocalDateTime start,
            LocalDateTime end
    ) {
        return orders.stream()
                .filter(this::isCompleted)
                .filter(order -> inRange(order.createdAt, start, end))
                .map(order -> money(order.totalAmount))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getCustomerName(Order order) {
        if (order.shippingName != null && !order.shippingName.isBlank()) {
            return order.shippingName;
        }

        if (order.user != null && order.user.getFullName() != null) {
            return order.user.getFullName();
        }

        return "Khách hàng";
    }

    private boolean isCompleted(Order order) {
        return order != null && "COMPLETED".equalsIgnoreCase(order.status);
    }

    private boolean isVisibleOrder(Order order) {
        if (order == null || order.status == null) {
            return false;
        }

        return !"PENDING_PAYMENT".equalsIgnoreCase(order.status);
    }

    private String normalizeStatus(String status) {
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            return "PREPARING";
        }

        if ("SHIPPING".equalsIgnoreCase(status)) {
            return "DELIVERING";
        }

        return status == null ? "" : status.toUpperCase(Locale.ROOT);
    }

    private boolean inRange(
            LocalDateTime value,
            LocalDateTime start,
            LocalDateTime end
    ) {
        return value != null
                && !value.isBefore(start)
                && value.isBefore(end);
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String timeAgo(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "--";
        }

        Duration duration = Duration.between(createdAt, LocalDateTime.now());

        long minutes = duration.toMinutes();

        if (minutes < 1) {
            return "Vừa xong";
        }

        if (minutes < 60) {
            return minutes + " phút trước";
        }

        long hours = duration.toHours();

        if (hours < 24) {
            return hours + " giờ trước";
        }

        long days = duration.toDays();

        return days + " ngày trước";
    }

    private static class FoodAgg {
        String name;
        long sold = 0;
        BigDecimal revenue = BigDecimal.ZERO;

        FoodAgg(String name) {
            this.name = name;
        }
    }
}