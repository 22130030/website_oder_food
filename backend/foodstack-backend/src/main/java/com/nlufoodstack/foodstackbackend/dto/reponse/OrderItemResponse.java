package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemResponse {
    private Long id;
    private Long foodItemId;
    private String foodName;
    private String foodImage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String note;
}