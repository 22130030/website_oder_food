package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.annotation.AdminLogAction;
import com.nlufoodstack.foodstackbackend.dto.request.AdminUserRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.AdminUserResponse;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.service.AdminUserService;
import org.springframework.web.bind.annotation.*;
import com.nlufoodstack.foodstackbackend.dto.reponse.AdminUserResponse;

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

    @PostMapping
    @AdminLogAction(action = "CREATE", target = "USER")
    public AdminUserResponse createUser(@RequestBody AdminUserRequest request) {
        return adminUserService.createUser(request);
    }

    @PutMapping("/{id}")
    @AdminLogAction(action = "UPDATE", target = "USER")
    public AdminUserResponse updateUser(
            @PathVariable Long id,
            @RequestBody AdminUserRequest request
    ) {
        return adminUserService.updateUser(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    @AdminLogAction(action = "TOGGLE", target = "USER_STATUS")
    public AdminUserResponse toggleActive(@PathVariable Long id) {
        return adminUserService.toggleActive(id);
    }

    @PatchMapping("/{id}/role")
    @AdminLogAction(action = "UPDATE", target = "USER_ROLE")
    public AdminUserResponse updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        Role role = Role.valueOf(body.get("role"));
        return adminUserService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
    @AdminLogAction(action = "DELETE", target = "USER")
    public Map<String, String> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Xóa tài khoản thành công");
        return response;
    }
}