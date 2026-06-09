package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.reponse.ReviewResponse;
import com.nlufoodstack.foodstackbackend.entity.Review;
import com.nlufoodstack.foodstackbackend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodReviewController {

    private final ReviewRepository reviewRepository;

    @GetMapping("/{foodId}/reviews")
    public List<ReviewResponse> getReviewsByFood(@PathVariable Long foodId) {
        return reviewRepository.findByFoodItemIdOrderByCreatedAtDesc(foodId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse response = new ReviewResponse();

        response.setId(review.getId());

        if (review.getFoodItem() != null) {
            response.setFoodItemId(review.getFoodItem().getId());
        }

        if (review.getOrder() != null) {
            response.setOrderId(review.getOrder().id);
        }

        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());

        if (review.getUser() != null) {
            response.setCustomerName(
                    review.getUser().getFullName() == null ||
                            review.getUser().getFullName().isBlank()
                            ? "Khách hàng"
                            : review.getUser().getFullName()
            );

            response.setCustomerAvatar(review.getUser().getAvatarUrl());
        } else {
            response.setCustomerName("Khách hàng");
        }

        return response;
    }
}