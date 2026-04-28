package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Setter
@Getter
public class FoodResponse {
    private Long id;
    private Integer categoryId;
    private String categoryName;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private String imageUrl;
    private Boolean isAvailable;
    private BigDecimal avgRating;
    private Integer totalSold;

}