package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.request.CheckoutRequest;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import com.nlufoodstack.foodstackbackend.service.CheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> checkout(
            @RequestBody CheckoutRequest request,
            Authentication auth,
            HttpServletRequest servletRequest
    ) {
        try {
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Bạn chưa đăng nhập hoặc token không hợp lệ"
                ));
            }

            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + auth.getName()));

            Object result = checkoutService.checkout(user, request, servletRequest);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Checkout thất bại",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) {
        try {
            Map<String, String> params = request.getParameterMap()
                    .entrySet()
                    .stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue()[0]
                    ));

            checkoutService.handleVnpayReturn(params);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật thanh toán thành công"
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Xử lý VNPay return thất bại",
                    "error", e.getMessage()
            ));
        }
    }
}