package com.nlufoodstack.foodstackbackend.dto.request;

import com.nlufoodstack.foodstackbackend.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserRequest {
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Role role;
    private Boolean isActive;
    private String newPassword;
}