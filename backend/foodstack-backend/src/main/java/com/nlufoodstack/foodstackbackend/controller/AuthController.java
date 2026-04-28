package com.nlufoodstack.foodstackbackend.controller;

import com.nlufoodstack.foodstackbackend.dto.request.GoogleLoginRequest;
import com.nlufoodstack.foodstackbackend.dto.request.LoginRequest;
import com.nlufoodstack.foodstackbackend.dto.request.RegisterRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.AuthResponse;
import com.nlufoodstack.foodstackbackend.service.AuthService;
import com.nlufoodstack.foodstackbackend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    //  Đăng nhập bằng Google
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(googleAuthService.loginWithGoogle(request.getIdToken()));
    }

    @GetMapping("/ping")
    public String ping() {
        return "Auth API is working";
    }

}
