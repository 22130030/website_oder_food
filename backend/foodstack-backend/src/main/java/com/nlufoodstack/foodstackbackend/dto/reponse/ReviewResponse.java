package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long foodItemId;
    private Long orderId;
    private Integer rating;
    private String comment;
    private String customerName;
    private String customerAvatar;
    private LocalDateTime createdAt;
}
