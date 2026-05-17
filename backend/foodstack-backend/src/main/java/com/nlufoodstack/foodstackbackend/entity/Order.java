package com.nlufoodstack.foodstackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(name="order_code", unique=true, nullable=false) public String orderCode;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id") public User user;
    @Column(name="shipping_name") public String shippingName;
    @Column(name="shipping_phone") public String shippingPhone;
    @Column(name="shipping_address") public String shippingAddress;
    @Column(name="shipping_lat") public BigDecimal shippingLat;
    @Column(name="shipping_lng") public BigDecimal shippingLng;
    @Column(name="shipping_place_id") public String shippingPlaceId;
    @Column(name="shipping_distance_km") public BigDecimal shippingDistanceKm;
    public BigDecimal subtotal;
    @Column(name="shipping_fee") public BigDecimal shippingFee;
    @Column(name="total_amount") public BigDecimal totalAmount;
    public String status = "PENDING";
    @Column(name="cancel_reason") public String cancelReason;
    @Column(name="payment_method") public String paymentMethod = "COD";
    @Column(name="payment_status") public String paymentStatus = "UNPAID";
    public String note;
    @Column(name="created_at") public LocalDateTime createdAt = LocalDateTime.now();
    @Column(name="updated_at") public LocalDateTime updatedAt = LocalDateTime.now();
}
