package com.nlufoodstack.foodstackbackend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class ChatEncryptionUtil {

    private static final String AES = "AES";
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BIT = 128;

    private final SecretKeySpec secretKeySpec;
    private final SecureRandom secureRandom = new SecureRandom();

    public ChatEncryptionUtil(@Value("${chat.encryption.secret}") String secret) {
        if (secret == null || secret.length() != 32) {
            throw new IllegalArgumentException("chat.encryption.secret phải có đúng 32 ký tự để dùng AES-256");
        }

        this.secretKeySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                AES
        );
    }

    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);

            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, gcmParameterSpec);

            byte[] encryptedBytes = cipher.doFinal(
                    plainText.getBytes(StandardCharsets.UTF_8)
            );

            String ivBase64 = Base64.getEncoder().encodeToString(iv);
            String encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes);

            return ivBase64 + ":" + encryptedBase64;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi mã hóa tin nhắn", e);
        }
    }

    public String decrypt(String encryptedText) {
        try {
            if (encryptedText == null || !encryptedText.contains(":")) {
                return encryptedText;
            }

            String[] parts = encryptedText.split(":", 2);

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encryptedBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);

            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmParameterSpec);

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "[Không thể giải mã tin nhắn]";
        }
    }
}