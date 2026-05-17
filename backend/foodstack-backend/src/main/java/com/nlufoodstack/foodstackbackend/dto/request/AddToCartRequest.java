package com.nlufoodstack.foodstackbackend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddToCartRequest {
    private Long foodItemId;
    private Integer quantity = 1;
    private String note;
}