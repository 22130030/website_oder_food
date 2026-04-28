package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.reponse.AuthResponse;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import com.nlufoodstack.foodstackbackend.util.JwtUtil;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public GoogleAuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse loginWithGoogle(String idToken) {
        Map<String, Object> payload = verifyTokenViaGoogle(idToken);

        String email = payload.get("email").toString().trim().toLowerCase();

        Object emailVerifiedObj = payload.get("email_verified");
        boolean emailVerified = emailVerifiedObj != null &&
                (emailVerifiedObj.toString().equals("true") || emailVerifiedObj.equals(Boolean.TRUE));
        if (!emailVerified) {
            throw new IllegalArgumentException("Email Google chưa được xác thực");
        }

        // Không check aud vì 2 project dùng chung Google Cloud Project
        String fullName = payload.getOrDefault("name", email).toString();
        String avatarUrl = payload.containsKey("picture") ? payload.get("picture").toString() : null;

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setAvatarUrl(avatarUrl);
            newUser.setPasswordHash(UUID.randomUUID().toString());
            newUser.setRole(Role.CUSTOMER);
            newUser.setIsActive(true);
            return userRepository.save(newUser);
        });

        if (!user.getIsActive()) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyTokenViaGoogle(String idToken) {
        try {
            RestClient restClient = RestClient.create();
            Map<String, Object> response = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("email")) {
                throw new IllegalArgumentException("Google ID Token không hợp lệ");
            }
            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Google ID Token không hợp lệ hoặc đã hết hạn");
        }
    }
}