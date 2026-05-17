package com.nlufoodstack.foodstackbackend.dto.reponse;

import java.math.BigDecimal;

public class CheckoutResponse {
    public Long orderId;
    public String orderCode;
    public BigDecimal totalAmount;
    public String paymentMethod;
    public String paymentStatus;
    public String paymentUrl;

    public CheckoutResponse(Long orderId, String orderCode, BigDecimal totalAmount, String paymentMethod, String paymentStatus, String paymentUrl) {
        this.orderId = orderId;
        this.orderCode = orderCode;
        this.totalAmount = totalAmount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.paymentUrl = paymentUrl;
    }
}
