package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.reponse.UserProfileResponse;
import com.nlufoodstack.foodstackbackend.dto.request.UpdateProfileRequest;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

    @GetMapping("/{userId}")
    public UserProfileResponse getProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return toResponse(user);
    }

    @PutMapping("/{userId}")
    public UserProfileResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @PostMapping("/upload-avatar")
    public Map<String, String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File ảnh trống");
            }

            String contentType = file.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Chỉ cho phép upload file ảnh");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get("uploads", "avatars");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String avatarUrl = "/uploads/avatars/" + fileName;

            return Map.of("avatarUrl", avatarUrl);
        } catch (Exception e) {
            throw new RuntimeException("Upload avatar thất bại: " + e.getMessage());
        }
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getIsActive()
        );
    }
}