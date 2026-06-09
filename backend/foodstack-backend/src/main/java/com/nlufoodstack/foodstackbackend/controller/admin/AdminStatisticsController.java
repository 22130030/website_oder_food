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
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatisticsController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getStatistics() {
        List<Order> orders = orderRepository.findAll();
        List<OrderItem> orderItems = orderItemRepository.findAll();
        List<User> users = userRepository.findAll();
        List<FoodItem> foods = foodItemRepository.findAll();

        LocalDate today = LocalDate.now();

        LocalDateTime startThisMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startNextMonth = startThisMonth.plusMonths(1);
        LocalDateTime startLastMonth = startThisMonth.minusMonths(1);

        BigDecimal revenueThisMonth = sumCompletedRevenue(
                orders,
                startThisMonth,
                startNextMonth
        );

        BigDecimal revenueLastMonth = sumCompletedRevenue(
                orders,
                startLastMonth,
                startThisMonth
        );

        long totalOrders = orders.stream()
                .filter(this::isVisibleOrder)
                .count();

        long ordersThisMonth = orders.stream()
                .filter(this::isVisibleOrder)
                .filter(order -> inRange(order.createdAt, startThisMonth, startNextMonth))
                .count();

        long ordersLastMonth = orders.stream()
                .filter(this::isVisibleOrder)
                .filter(order -> inRange(order.createdAt, startLastMonth, startThisMonth))
                .count();

        long customersThisMonth = users.stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .filter(user -> inRange(user.getCreatedAt(), startThisMonth, startNextMonth))
                .count();

        long customersLastMonth = users.stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .filter(user -> inRange(user.getCreatedAt(), startLastMonth, startThisMonth))
                .count();

        double averageRating = foods.stream()
                .map(FoodItem::getAvgRating)
                .filter(Objects::nonNull)
                .filter(rating -> rating.compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0);

        long ratingCount = foods.stream()
                .map(FoodItem::getAvgRating)
                .filter(Objects::nonNull)
                .filter(rating -> rating.compareTo(BigDecimal.ZERO) > 0)
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("revenueThisMonth", revenueThisMonth);
        summary.put("revenueGrowthPercent", growthPercent(revenueThisMonth, revenueLastMonth));
        summary.put("totalOrders", totalOrders);
        summary.put("orderGrowthPercent", growthPercent(ordersThisMonth, ordersLastMonth));
        summary.put("newCustomersThisMonth", customersThisMonth);
        summary.put("customerGrowthPercent", growthPercent(customersThisMonth, customersLastMonth));
        summary.put("averageRating", roundOne(averageRating));
        summary.put("ratingCount", ratingCount);

        Map<String, Object> revenue = new LinkedHashMap<>();
        revenue.put("week", buildRevenueByWeek(orders, today));
        revenue.put("month", buildRevenueBySixMonths(orders, today));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("summary", summary);
        response.put("revenue", revenue);
        response.put("statusDistribution", buildStatusDistribution(orders));
        response.put("topFoods", buildTopFoods(orderItems));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> buildRevenueByWeek(List<Order> orders, LocalDate today) {
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        String[] labels = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};

        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = start.plusDays(1);

            BigDecimal value = sumCompletedRevenue(orders, start, end);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", labels[i]);
            item.put("value", value);

            result.add(item);
        }

        return result;
    }

    private List<Map<String, Object>> buildRevenueBySixMonths(List<Order> orders, LocalDate today) {
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDate month = today.minusMonths(i).withDayOfMonth(1);
            LocalDateTime start = month.atStartOfDay();
            LocalDateTime end = start.plusMonths(1);

            BigDecimal value = sumCompletedRevenue(orders, start, end);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", "T" + month.getMonthValue());
            item.put("value", value);

            result.add(item);
        }

        return result;
    }

    private List<Map<String, Object>> buildStatusDistribution(List<Order> orders) {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("COMPLETED", "Hoàn thành");
        labels.put("DELIVERING", "Đang giao");
        labels.put("PREPARING", "Đang chuẩn bị");
        labels.put("PENDING", "Chờ xác nhận");
        labels.put("CANCELLED", "Đã hủy");

        Map<String, String> colors = new LinkedHashMap<>();
        colors.put("COMPLETED", "#27ae60");
        colors.put("DELIVERING", "#3498db");
        colors.put("PREPARING", "#f39c12");
        colors.put("PENDING", "#e67e22");
        colors.put("CANCELLED", "#e74c3c");

        Map<String, Long> counts = new LinkedHashMap<>();

        labels.keySet().forEach(status -> counts.put(status, 0L));

        for (Order order : orders) {
            if (!isVisibleOrder(order)) {
                continue;
            }

            String status = normalizeStatus(order.status);

            if (counts.containsKey(status)) {
                counts.put(status, counts.get(status) + 1);
            }
        }

        long total = counts.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        List<Map<String, Object>> result = new ArrayList<>();

        for (String status : labels.keySet()) {
            long count = counts.getOrDefault(status, 0L);
            int percent = total == 0 ? 0 : (int) Math.round(count * 100.0 / total);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("status", status);
            item.put("label", labels.get(status));
            item.put("count", count);
            item.put("percent", percent);
            item.put("color", colors.get(status));

            result.add(item);
        }

        return result;
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

        List<FoodAgg> sorted = map.values()
                .stream()
                .sorted(
                        Comparator.comparingLong((FoodAgg item) -> item.sold)
                                .reversed()
                                .thenComparing(item -> item.name)
                )
                .limit(5)
                .toList();

        long maxSold = sorted.isEmpty() ? 1 : Math.max(1, sorted.get(0).sold);

        List<Map<String, Object>> result = new ArrayList<>();

        for (FoodAgg item : sorted) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", item.name);
            row.put("sold", item.sold);
            row.put("revenue", item.revenue);
            row.put("percent", (int) Math.round(item.sold * 100.0 / maxSold));

            result.add(row);
        }

        return result;
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

    private int growthPercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100 : 0;
        }

        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private int growthPercent(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100 : 0;
        }

        return (int) Math.round((current - previous) * 100.0 / previous);
    }

    private double roundOne(double value) {
        return Math.round(value * 10.0) / 10.0;
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