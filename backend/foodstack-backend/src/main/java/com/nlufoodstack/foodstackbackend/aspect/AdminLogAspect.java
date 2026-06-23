package com.nlufoodstack.foodstackbackend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nlufoodstack.foodstackbackend.annotation.AdminLogAction;
import com.nlufoodstack.foodstackbackend.dto.reponse.AdminUserResponse;
import com.nlufoodstack.foodstackbackend.entity.AdminLog;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.AdminLogRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class AdminLogAspect {

    private final AdminLogRepository adminLogRepository;
    private final UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterReturning(pointcut = "@annotation(adminLogAction)", returning = "result")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveAdminLog(JoinPoint joinPoint, AdminLogAction adminLogAction, Object result) {
        try {
            if (result instanceof ResponseEntity<?> response) {
                if (!response.getStatusCode().is2xxSuccessful()) {
                    return;
                }
            }

            User admin = getCurrentAdmin();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("method", joinPoint.getSignature().getName());
            data.put("arguments", buildSafeArgs(joinPoint.getArgs()));
            data.put("result", safeValue(unwrapResponse(result)));

            AdminLog log = new AdminLog();
            log.setAdmin(admin);
            log.setAction(adminLogAction.action());
            log.setTarget(adminLogAction.target());
            log.setOldData(null);
            log.setNewData(toJson(data));

            adminLogRepository.save(log);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email).orElse(null);
    }

    private Object unwrapResponse(Object result) {
        if (result instanceof ResponseEntity<?> response) {
            return response.getBody();
        }

        return result;
    }

    private List<Object> buildSafeArgs(Object[] args) {
        List<Object> safeArgs = new ArrayList<>();

        if (args == null) {
            return safeArgs;
        }

        for (Object arg : args) {
            safeArgs.add(safeValue(arg));
        }

        return safeArgs;
    }

    private Object safeValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof AdminUserResponse user) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", user.getId());
            map.put("fullName", user.getFullName());
            map.put("email", user.getEmail());
            map.put("phone", user.getPhone());
            map.put("role", user.getRole() != null ? user.getRole().name() : null);
            map.put("isActive", user.getIsActive());
            map.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            map.put("updatedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null);
            return map;
        }

        if (value instanceof String ||
                value instanceof Number ||
                value instanceof Boolean) {
            return value;
        }

        if (value instanceof Map<?, ?> map) {
            return map;
        }

        try {
            return objectMapper.convertValue(value, Map.class);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private String toJson(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "{\"message\":\"Cannot convert data to JSON\"}";
        }
    }
}