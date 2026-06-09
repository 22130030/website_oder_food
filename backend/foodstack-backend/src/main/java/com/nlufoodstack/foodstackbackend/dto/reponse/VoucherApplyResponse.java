package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VoucherApplyResponse {
    private Long voucherId;
    private String code;
    private String name;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}
