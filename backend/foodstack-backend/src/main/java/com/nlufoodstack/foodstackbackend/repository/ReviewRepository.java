package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndOrderItemId(Long userId, Long orderItemId);

    @Query("""
        SELECT AVG(r.rating)
        FROM Review r
        WHERE r.foodItem.id = :foodItemId
    """)
    Double findAverageRatingByFoodItemId(@Param("foodItemId") Long foodItemId);

    List<Review> findByFoodItemIdOrderByCreatedAtDesc(Long foodItemId);

    long countByFoodItemId(Long foodItemId);
}