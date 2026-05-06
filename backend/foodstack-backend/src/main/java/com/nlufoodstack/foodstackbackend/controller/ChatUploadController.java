package com.nlufoodstack.foodstackbackend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/upload-image")
    public Map<String, String> uploadChatImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("File ảnh trống");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Chỉ cho phép upload file ảnh");
            }

            String originalName = file.getOriginalFilename();
            String ext = "";

            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + ext;

            Path chatUploadPath = Paths.get(uploadDir, "chat");

            if (!Files.exists(chatUploadPath)) {
                Files.createDirectories(chatUploadPath);
            }

            Path filePath = chatUploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String imageUrl = "/uploads/chat/" + fileName;

            return Map.of("imageUrl", imageUrl);
        } catch (Exception e) {
            throw new RuntimeException("Upload ảnh chat thất bại: " + e.getMessage());
        }
    }
}