package com.nlufoodstack.foodstackbackend.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class VnpayUtil {
    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            hmac512.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    public static String buildQuery(Map<String, String> params, boolean encodeValue) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        for (String key : keys) {
            String value = params.get(key);
            if (value == null || value.isBlank()) continue;
            if (sb.length() > 0) sb.append('&');
            sb.append(URLEncoder.encode(key, StandardCharsets.US_ASCII));
            sb.append('=');
            sb.append(encodeValue ? URLEncoder.encode(value, StandardCharsets.US_ASCII) : value);
        }
        return sb.toString();
    }
}
