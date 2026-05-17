package com.nlufoodstack.foodstackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="order_id") public Order order;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="food_item_id") public FoodItem foodItem;
    @Column(name="food_name") public String foodName;
    @Column(name="food_image") public String foodImage;
    @Column(name="unit_price") public BigDecimal unitPrice;
    public Integer quantity;
    public BigDecimal subtotal;
    public String note;
}
