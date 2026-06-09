package com.nlufoodstack.foodstackbackend.dto.request;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long orderId;
    private Long orderItemId;
    private Integer rating;
    private String comment;
}