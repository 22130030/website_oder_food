package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    @Query("""
        SELECT f
        FROM FoodItem f
        WHERE 
            (:keyword IS NULL OR :keyword = '' 
                OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(f.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
        AND (:categoryId IS NULL OR f.category.id = :categoryId)
        AND (:minPrice IS NULL OR f.price >= :minPrice)
        AND (:maxPrice IS NULL OR f.price <= :maxPrice)
    """)
    List<FoodItem> searchAndFilter(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice
    );
}