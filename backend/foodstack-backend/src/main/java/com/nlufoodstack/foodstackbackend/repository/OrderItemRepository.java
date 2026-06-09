package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrder(Order order);
    Optional<OrderItem> findByIdAndOrder(Long id, Order order);
}