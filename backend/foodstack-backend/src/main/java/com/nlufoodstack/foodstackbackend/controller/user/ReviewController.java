package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.request.ReviewRequest;
import com.nlufoodstack.foodstackbackend.entity.*;
import com.nlufoodstack.foodstackbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/user/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final FoodItemRepository foodItemRepository;

    private static final List<String> POSITIVE_WORDS = List.of(
            "ngon",
            "rat ngon",
            "tuyet voi",
            "xuat sac",
            "hai long",
            "thich",
            "se mua lai",
            "dang tien",
            "tot",
            "hap dan",
            "vua mieng",
            "de an"
    );

    private static final List<String> NEGATIVE_WORDS = List.of(
            "te",
            "qua te",
            "khong ngon",
            "chua ngon",
            "khong duoc ngon",
            "khong tot",
            "that vong",
            "nguoi",
            "qua man",
            "qua nhat",
            "kho an",
            "kem",
            "khong hai long",
            "chan",
            "hoi",
            "khong dang tien"
    );

    @PostMapping
    @Transactional
    public ResponseEntity<?> createReview(
            @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Bạn chưa đăng nhập"
                ));
            }

            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

            if (request.getOrderId() == null || request.getOrderItemId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Thiếu thông tin đơn hàng hoặc món cần đánh giá"
                ));
            }

            Integer rating = request.getRating();

            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Số sao phải từ 1 đến 5"
                ));
            }

            String comment = request.getComment() == null
                    ? ""
                    : request.getComment().trim();

            validateRatingAndComment(rating, comment);

            Order order = orderRepository.findByIdAndUser(request.getOrderId(), user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

            if (!"COMPLETED".equalsIgnoreCase(order.status)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Chỉ có thể đánh giá khi đơn hàng đã hoàn thành"
                ));
            }

            OrderItem orderItem = orderItemRepository
                    .findByIdAndOrder(request.getOrderItemId(), order)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy món trong đơn hàng"));

            if (orderItem.foodItem == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Món ăn không còn tồn tại trong hệ thống"
                ));
            }

            if (reviewRepository.existsByUserIdAndOrderItemId(user.getId(), orderItem.id)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Bạn đã đánh giá món này rồi"
                ));
            }

            Review review = new Review();
            review.setUser(user);
            review.setOrder(order);
            review.setOrderItem(orderItem);
            review.setFoodItem(orderItem.foodItem);
            review.setRating(rating);
            review.setComment(comment);

            Review saved = reviewRepository.save(review);

            updateFoodAverageRating(orderItem.foodItem);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "Đánh giá thành công");
            response.put("reviewId", saved.getId());
            response.put("foodItemId", orderItem.foodItem.getId());
            response.put("avgRating", orderItem.foodItem.getAvgRating());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi gửi đánh giá",
                    "error", e.getMessage()
            ));
        }
    }

    private void validateRatingAndComment(Integer rating, String comment) {
        if (comment == null || comment.trim().length() < 5) {
            throw new IllegalArgumentException("Vui lòng nhập nhận xét ít nhất 5 ký tự");
        }

        String text = normalizeText(comment);
        String positiveCheckText = removeNegativePhrases(text);

        if (rating <= 2 && containsAny(positiveCheckText, POSITIVE_WORDS)) {
            throw new IllegalArgumentException(
                    "Bạn đang chọn số sao thấp nhưng nội dung lại đang khen món ăn. Vui lòng điều chỉnh số sao hoặc lời nhận xét."
            );
        }

        if (rating >= 4 && containsAny(text, NEGATIVE_WORDS)) {
            throw new IllegalArgumentException(
                    "Bạn đang chọn số sao cao nhưng nội dung lại đang chê món ăn. Vui lòng điều chỉnh số sao hoặc lời nhận xét."
            );
        }
    }

    private void updateFoodAverageRating(FoodItem foodItem) {
        Double avg = reviewRepository.findAverageRatingByFoodItemId(foodItem.getId());

        BigDecimal avgRating = BigDecimal.valueOf(avg == null ? 0 : avg)
                .setScale(2, RoundingMode.HALF_UP);

        foodItem.setAvgRating(avgRating);
        foodItemRepository.save(foodItem);
    }

    private String normalizeText(String input) {
        String value = input == null ? "" : input;

        value = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return value.toLowerCase(Locale.ROOT)
                .replace("đ", "d")
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String removeNegativePhrases(String text) {
        String result = " " + text + " ";

        for (String word : NEGATIVE_WORDS) {
            result = result.replace(" " + normalizeText(word) + " ", " ");
        }

        return result.replaceAll("\\s+", " ").trim();
    }

    private boolean containsAny(String text, List<String> words) {
        String value = " " + text + " ";

        for (String word : words) {
            String keyword = " " + normalizeText(word) + " ";

            if (value.contains(keyword)) {
                return true;
            }
        }

        return false;
    }
}
