package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.dto.request.AdminUserRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.AdminUserResponse;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.service.AdminUserService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<AdminUserResponse> getAllUsers(
            @RequestParam(required = false) String keyword
    ) {
        return adminUserService.searchUsers(keyword);
    }

    @GetMapping("/{id}")
    public AdminUserResponse getUserById(@PathVariable Long id) {
        return adminUserService.getUserById(id);
    }

    @PutMapping("/{id}")
    public AdminUserResponse updateUser(
            @PathVariable Long id,
            @RequestBody AdminUserRequest request
    ) {
        return adminUserService.updateUser(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    public AdminUserResponse toggleActive(@PathVariable Long id) {
        return adminUserService.toggleActive(id);
    }

    @PatchMapping("/{id}/role")
    public AdminUserResponse updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        Role role = Role.valueOf(body.get("role"));
        return adminUserService.updateRole(id, role);
    }
}