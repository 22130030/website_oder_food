package com.nlufoodstack.foodstackbackend.controller;

import com.nlufoodstack.foodstackbackend.dto.request.ForgotPasswordRequest;
import com.nlufoodstack.foodstackbackend.dto.request.GoogleLoginRequest;
import com.nlufoodstack.foodstackbackend.dto.request.LoginRequest;
import com.nlufoodstack.foodstackbackend.dto.request.RegisterRequest;
import com.nlufoodstack.foodstackbackend.dto.request.ResetPasswordRequest;
import com.nlufoodstack.foodstackbackend.dto.request.VerifyRegisterCodeRequest;
import com.nlufoodstack.foodstackbackend.dto.request.VerifyResetCodeRequest;
import com.nlufoodstack.foodstackbackend.dto.reponse.AuthResponse;
import com.nlufoodstack.foodstackbackend.service.AuthService;
import com.nlufoodstack.foodstackbackend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nlufoodstack.foodstackbackend.dto.request.FacebookLoginRequest;
import com.nlufoodstack.foodstackbackend.service.FacebookAuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final FacebookAuthService facebookAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService, FacebookAuthService facebookAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.facebookAuthService = facebookAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Đăng ký thành công. Mã xác thực đã được gửi về email của bạn"));
    }

    @PostMapping("/verify-register-code")
    public ResponseEntity<AuthResponse> verifyRegisterCode(@Valid @RequestBody VerifyRegisterCodeRequest request) {
        return ResponseEntity.ok(authService.verifyRegisterCode(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendForgotPasswordCode(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác thực đã được gửi về email của bạn"));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        authService.verifyResetCode(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác thực hợp lệ"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(googleAuthService.loginWithGoogle(request.getIdToken()));
    }
    @PostMapping("/facebook")
    public ResponseEntity<AuthResponse> facebookLogin(@Valid @RequestBody FacebookLoginRequest request) {
        return ResponseEntity.ok(facebookAuthService.loginWithFacebook(request.getAccessToken()));
    }

    @GetMapping("/ping")
    public String ping() {
        return "Auth API is working";
    }
}