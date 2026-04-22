package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.reponse.FoodResponse;
import com.nlufoodstack.foodstackbackend.dto.request.FoodRequest;
import com.nlufoodstack.foodstackbackend.entity.Category;
import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import com.nlufoodstack.foodstackbackend.repository.CategoryRepository;
import com.nlufoodstack.foodstackbackend.repository.FoodItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodAdminService {

    private final FoodItemRepository foodItemRepository;
    private final CategoryRepository categoryRepository;

    public FoodAdminService(FoodItemRepository foodItemRepository,
                            CategoryRepository categoryRepository) {
        this.foodItemRepository = foodItemRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<FoodResponse> getAllFoods() {
        return foodItemRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FoodResponse getFoodById(Long id) {
        FoodItem food = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        return toResponse(food);
    }
    // Them mon an
    public FoodResponse createFood(FoodRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        FoodItem food = new FoodItem();
        food.setCategory(category);
        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setDiscountPrice(request.getDiscountPrice());
        food.setImageUrl(request.getImageUrl());
        food.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);

        return toResponse(foodItemRepository.save(food));
    }
    // Chinh sua mon an
    public FoodResponse updateFood(Long id, FoodRequest request) {
        FoodItem food = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        food.setCategory(category);
        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setDiscountPrice(request.getDiscountPrice());
        food.setImageUrl(request.getImageUrl());
        food.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : food.getIsAvailable());

        return toResponse(foodItemRepository.save(food));
    }
    // Xoa mon an
    public void deleteFood(Long id) {
        FoodItem food = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        foodItemRepository.delete(food);
    }

    public FoodResponse toggleAvailability(Long id) {
        FoodItem food = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        food.setIsAvailable(!food.getIsAvailable());
        return toResponse(foodItemRepository.save(food));
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    private FoodResponse toResponse(FoodItem food) {
        FoodResponse response = new FoodResponse();
        response.setId(food.getId());
        response.setCategoryId(food.getCategory().getId());
        response.setCategoryName(food.getCategory().getName());
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
