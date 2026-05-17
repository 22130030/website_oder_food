package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.request.AddToCartRequest;
import com.nlufoodstack.foodstackbackend.entity.CartItem;
import com.nlufoodstack.foodstackbackend.entity.FoodItem;
import jakarta.transaction.Transactional;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.CartItemRepository;
import com.nlufoodstack.foodstackbackend.repository.FoodItemRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final FoodItemRepository foodItemRepository;

    @PostMapping("/add")
    public CartItem addToCart(@RequestParam Long userId,
                              @RequestBody AddToCartRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        CartItem cartItem = cartItemRepository
                .findByUserIdAndFoodItemId(userId, request.getFoodItemId())
                .orElse(null);

        if (cartItem != null) {
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
        } else {
            cartItem = CartItem.builder()
                    .user(user)
                    .foodItem(foodItem)
                    .quantity(request.getQuantity())
                    .note(request.getNote())
                    .build();
        }

        return cartItemRepository.save(cartItem);
    }

    @GetMapping
    public List<CartItem> getCart(@RequestParam Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @DeleteMapping("/{foodItemId}")
    @Transactional
    public String removeFromCart(@RequestParam Long userId,
                                 @PathVariable Long foodItemId) {
        cartItemRepository.deleteByUserIdAndFoodItemId(userId, foodItemId);
        return "Đã xóa món khỏi giỏ hàng";
    }
}