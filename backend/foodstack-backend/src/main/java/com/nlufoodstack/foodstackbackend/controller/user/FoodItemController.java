package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.reponse.FoodResponse;
import com.nlufoodstack.foodstackbackend.entity.Category;
import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import com.nlufoodstack.foodstackbackend.repository.CategoryRepository;
import com.nlufoodstack.foodstackbackend.repository.FoodItemRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FoodItemController {

    private final FoodItemRepository foodItemRepository;
    private final CategoryRepository categoryRepository;

    public FoodItemController(FoodItemRepository foodItemRepository,
                              CategoryRepository categoryRepository) {
        this.foodItemRepository = foodItemRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/foods")
    public List<FoodResponse> getFoods(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false, defaultValue = "default") String sort
    ) {
        List<FoodItem> foods = foodItemRepository.findAll();

        return foods.stream()
                .filter(food -> {
                    if (keyword == null || keyword.trim().isEmpty()) {
                        return true;
                    }

                    String lowerKeyword = keyword.trim().toLowerCase();

                    String name = food.getName() != null
                            ? food.getName().toLowerCase()
                            : "";

                    String description = food.getDescription() != null
                            ? food.getDescription().toLowerCase()
                            : "";

                    return name.contains(lowerKeyword) || description.contains(lowerKeyword);
                })
                .filter(food -> {
                    if (categoryId == null) {
                        return true;
                    }

                    return food.getCategory() != null
                            && food.getCategory().getId().equals(categoryId);
                })
                .filter(food -> {
                    if (minPrice == null) {
                        return true;
                    }

                    return food.getPrice() != null
                            && food.getPrice().compareTo(minPrice) >= 0;
                })
                .filter(food -> {
                    if (maxPrice == null) {
                        return true;
                    }

                    return food.getPrice() != null
                            && food.getPrice().compareTo(maxPrice) <= 0;
                })
                .filter(food -> {
                    if (available == null) {
                        return true;
                    }

                    return food.getIsAvailable() != null
                            && food.getIsAvailable().equals(available);
                })
                .sorted(getComparator(sort))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/foods/{id}")
    public FoodResponse getFoodById(@PathVariable Long id) {
        FoodItem food = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        return toResponse(food);
    }

    @GetMapping("/categories")
    public List<Category> getCategories() {
        return categoryRepository.findAll()
                .stream()
                .filter(category -> category.getIsActive() == null || category.getIsActive())
                .toList();
    }

    private Comparator<FoodItem> getComparator(String sort) {
        if (sort == null) {
            return Comparator.comparing(FoodItem::getId).reversed();
        }

        return switch (sort) {
            case "priceAsc" -> Comparator.comparing(
                    FoodItem::getPrice,
                    Comparator.nullsLast(BigDecimal::compareTo)
            );

            case "priceDesc" -> Comparator.comparing(
                    FoodItem::getPrice,
                    Comparator.nullsLast(BigDecimal::compareTo)
            ).reversed();

            case "nameAsc" -> Comparator.comparing(
                    FoodItem::getName,
                    Comparator.nullsLast(String::compareToIgnoreCase)
            );

            case "soldDesc" -> Comparator.comparing(
                    FoodItem::getTotalSold,
                    Comparator.nullsLast(Integer::compareTo)
            ).reversed();

            case "ratingDesc" -> Comparator.comparing(
                    FoodItem::getAvgRating,
                    Comparator.nullsLast(BigDecimal::compareTo)
            ).reversed();

            default -> Comparator.comparing(FoodItem::getId).reversed();
        };
    }

    private FoodResponse toResponse(FoodItem food) {
        FoodResponse response = new FoodResponse();

        response.setId(food.getId());

        if (food.getCategory() != null) {
            response.setCategoryId(food.getCategory().getId());
            response.setCategoryName(food.getCategory().getName());
        }

        response.setName(food.getName());
        response.setDescription(food.getDescription());
        response.setPrice(food.getPrice());
        response.setDiscountPrice(food.getDiscountPrice());
        response.setImageUrl(food.getImageUrl());
        response.setIsAvailable(food.getIsAvailable());
        response.setAvgRating(food.getAvgRating());
        response.setTotalSold(food.getTotalSold());

        return response;
    }
}