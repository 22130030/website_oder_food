package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.dto.reponse.FoodResponse;
import com.nlufoodstack.foodstackbackend.dto.request.FoodRequest;
import com.nlufoodstack.foodstackbackend.entity.Category;
import com.nlufoodstack.foodstackbackend.service.FoodAdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminFoodController {

    private final FoodAdminService foodAdminService;

    public AdminFoodController(FoodAdminService foodAdminService) {
        this.foodAdminService = foodAdminService;
    }

    @GetMapping("/foods")
    public List<FoodResponse> getAllFoods() {
        return foodAdminService.getAllFoods();
    }

    @GetMapping("/foods/{id}")
    public FoodResponse getFoodById(@PathVariable Long id) {
        return foodAdminService.getFoodById(id);
    }

    @PostMapping("/foods")
    public FoodResponse createFood(@RequestBody FoodRequest request) {
        return foodAdminService.createFood(request);
    }

    @PutMapping("/foods/{id}")
    public FoodResponse updateFood(@PathVariable Long id, @RequestBody FoodRequest request) {
        return foodAdminService.updateFood(id, request);
    }

    @DeleteMapping("/foods/{id}")
    public String deleteFood(@PathVariable Long id) {
        foodAdminService.deleteFood(id);
        return "Xóa món ăn thành công";
    }

    @PatchMapping("/foods/{id}/availability")
    public FoodResponse toggleAvailability(@PathVariable Long id) {
        return foodAdminService.toggleAvailability(id);
    }

    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return foodAdminService.getAllCategories();
    }
}