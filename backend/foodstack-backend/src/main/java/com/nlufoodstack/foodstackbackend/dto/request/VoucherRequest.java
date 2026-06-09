package com.nlufoodstack.foodstackbackend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherRequest {
    private String code;
    private String name;
    private String description;

    private String discountType;

    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;

    private Integer quantity;
    private Boolean active;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
}