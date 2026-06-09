package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String discountType;

    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;

    private Integer quantity;
    private Integer usedCount;
    private Integer remainingQuantity;

    private Boolean active;
    private String displayStatus;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
