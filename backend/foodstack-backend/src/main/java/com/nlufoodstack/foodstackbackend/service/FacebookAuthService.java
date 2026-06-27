package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.reponse.AuthResponse;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import com.nlufoodstack.foodstackbackend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import jakarta.annotation.PostConstruct;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.UUID;

@Service
public class FacebookAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${facebook.app-id}")
    private String facebookAppId;

    @Value("${facebook.app-secret}")
    private String facebookAppSecret;

    public FacebookAuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse loginWithFacebook(String accessToken) {
        verifyFacebookAccessToken(accessToken);

        Map<String, Object> profile = getFacebookProfile(accessToken);

        String email = profile.get("email") == null
                ? null
                : profile.get("email").toString().trim().toLowerCase();

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Facebook không trả về email. Vui lòng cấp quyền email hoặc dùng cách đăng nhập khác."
            );
        }

        String fullName = profile.getOrDefault("name", email).toString();
        String avatarUrl = extractAvatarUrl(profile);

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setAvatarUrl(avatarUrl);
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(Role.CUSTOMER);
            newUser.setIsActive(true);
            newUser.setEmailVerified(true);

            return userRepository.save(newUser);
        });

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
            user.setIsActive(true);
            userRepository.save(user);
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
    @PostConstruct
    public void checkFacebookConfig() {
        System.out.println("FACEBOOK_APP_ID loaded = " + facebookAppId);
        System.out.println("FACEBOOK_APP_SECRET loaded = " +
                (facebookAppSecret == null || facebookAppSecret.isBlank()
                        ? "EMPTY"
                        : "OK"));
    }

    @SuppressWarnings("unchecked")
    private void verifyFacebookAccessToken(String accessToken) {
        try {
            String appAccessToken = facebookAppId + "|" + facebookAppSecret;

            RestClient restClient = RestClient.create();

            String rawResponse = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v25.0/debug_token")
                            .queryParam("input_token", accessToken)
                            .queryParam("access_token", appAccessToken)
                            .build())
                    .retrieve()
                    .body(String.class);

            System.out.println("FACEBOOK DEBUG RAW RESPONSE = " + rawResponse);

            Map<String, Object> response = objectMapper.readValue(
                    rawResponse,
                    new TypeReference<Map<String, Object>>() {}
            );

            if (response == null || response.get("data") == null) {
                throw new IllegalArgumentException("Facebook không trả về dữ liệu debug token");
            }

            Map<String, Object> data = (Map<String, Object>) response.get("data");

            boolean isValid = Boolean.TRUE.equals(data.get("is_valid"));
            String appIdFromToken = data.get("app_id") == null
                    ? ""
                    : data.get("app_id").toString();

            if (!isValid) {
                throw new IllegalArgumentException("Facebook access token không hợp lệ hoặc đã hết hạn");
            }

            if (!facebookAppId.equals(appIdFromToken)) {
                throw new IllegalArgumentException(
                        "Facebook access token không thuộc app hiện tại. Token app_id="
                                + appIdFromToken + ", backend app_id=" + facebookAppId
                );
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Không thể xác thực Facebook access token: " + e.getMessage());
        }
    }

    private Map<String, Object> getFacebookProfile(String accessToken) {
        try {
            RestClient restClient = RestClient.create();

            String rawResponse = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v25.0/me")
                            .queryParam("fields", "id,name,email,picture.type(large)")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .body(String.class);

            System.out.println("FACEBOOK PROFILE RAW RESPONSE = " + rawResponse);

            Map<String, Object> profile = objectMapper.readValue(
                    rawResponse,
                    new TypeReference<Map<String, Object>>() {}
            );

            if (profile == null || profile.get("id") == null) {
                throw new IllegalArgumentException("Không lấy được thông tin tài khoản Facebook");
            }

            return profile;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Không lấy được thông tin tài khoản Facebook: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractAvatarUrl(Map<String, Object> profile) {
        try {
            Object pictureObj = profile.get("picture");

            if (!(pictureObj instanceof Map<?, ?> pictureMap)) {
                return null;
            }

            Object dataObj = pictureMap.get("data");

            if (!(dataObj instanceof Map<?, ?> dataMap)) {
                return null;
            }

            Object urlObj = dataMap.get("url");

            return urlObj == null ? null : urlObj.toString();
        } catch (Exception e) {
            return null;
        }
    }
}