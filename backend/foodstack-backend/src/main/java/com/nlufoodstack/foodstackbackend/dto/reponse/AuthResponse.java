package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String fullName;
    private String email;
    private String role;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long userId, String fullName, String email, String role) {
        this.token = token;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

}

