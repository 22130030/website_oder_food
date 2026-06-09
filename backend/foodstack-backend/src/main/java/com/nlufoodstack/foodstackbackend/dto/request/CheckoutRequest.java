package com.nlufoodstack.foodstackbackend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
@Data
public class CheckoutRequest {
    public String shippingName;
    public String shippingPhone;
    public String shippingAddress;
    public BigDecimal shippingLat;
    public BigDecimal shippingLng;
    public String shippingPlaceId;
    public BigDecimal shippingDistanceKm;
    public String paymentMethod; // COD | VNPAY
    private String voucherCode;
    public String note;
}
