package com.nlufoodstack.foodstackbackend.controller.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> dashboard() {
        return Map.of("message", "Chỉ ADMIN mới truy cập được dashboard này");
    }
}
