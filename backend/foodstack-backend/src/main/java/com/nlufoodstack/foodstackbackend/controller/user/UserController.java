package com.nlufoodstack.foodstackbackend.controller.user;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public Map<String, Object> me(Authentication authentication) {
        return Map.of(
                "message", "Bạn đã truy cập thành công API của USER",
                "email", authentication.getName(),
                "authorities", authentication.getAuthorities()
        );
    }
}
