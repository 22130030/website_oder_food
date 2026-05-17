package com.nlufoodstack.foodstackbackend.dto.request;

import java.math.BigDecimal;

public class CheckoutRequest {
    public String shippingName;
    public String shippingPhone;
    public String shippingAddress;
    public BigDecimal shippingLat;
    public BigDecimal shippingLng;
    public String shippingPlaceId;
    public BigDecimal shippingDistanceKm;
    public String paymentMethod; // COD | VNPAY
    public String note;
}
