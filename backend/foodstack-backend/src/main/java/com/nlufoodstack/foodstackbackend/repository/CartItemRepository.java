package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByUserIdAndFoodItemId(Long userId, Long foodItemId);

    List<CartItem> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.user.id = :userId AND c.foodItem.id = :foodItemId")
    void deleteByUserIdAndFoodItemId(Long userId, Long foodItemId);
}