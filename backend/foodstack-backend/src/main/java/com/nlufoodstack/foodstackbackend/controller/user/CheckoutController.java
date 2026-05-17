package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.request.CheckoutRequest;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import com.nlufoodstack.foodstackbackend.service.CheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/checkout")
public class CheckoutController {
    private final CheckoutService checkoutService; private final UserRepository userRepository;
    public CheckoutController(CheckoutService checkoutService, UserRepository userRepository) { this.checkoutService = checkoutService; this.userRepository = userRepository; }

    @PostMapping
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request, Authentication auth, HttpServletRequest servletRequest) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        return ResponseEntity.ok(checkoutService.checkout(user, request, servletRequest));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = request.getParameterMap().entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue()[0]));
        checkoutService.handleVnpayReturn(params);
        return ResponseEntity.ok(Map.of("message", "Cập nhật thanh toán thành công"));
    }
}
