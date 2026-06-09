package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String status;
    private String paymentMethod;
    private String paymentStatus;

    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private Long userId;
    private String customerEmail;

    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private BigDecimal shippingLat;
    private BigDecimal shippingLng;
    private String shippingPlaceId;
    private BigDecimal shippingDistanceKm;

    private String note;
    private String cancelReason;

    private String voucherCode;
    private BigDecimal discountAmount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<OrderItemResponse> items;
}