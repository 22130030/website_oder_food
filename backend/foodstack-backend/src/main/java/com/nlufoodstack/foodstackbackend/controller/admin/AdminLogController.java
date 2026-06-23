package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.dto.reponse.AdminLogResponse;
import com.nlufoodstack.foodstackbackend.entity.AdminLog;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.AdminLogRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
public class AdminLogController {

    private final AdminLogRepository adminLogRepository;

    public AdminLogController(AdminLogRepository adminLogRepository) {
        this.adminLogRepository = adminLogRepository;
    }

    @GetMapping
    public List<AdminLogResponse> getLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String target
    ) {
        return adminLogRepository.searchLogs(normalize(action), normalize(target))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AdminLogResponse toResponse(AdminLog log) {
        AdminLogResponse res = new AdminLogResponse();

        res.setId(log.getId());
        res.setAction(log.getAction());
        res.setTarget(log.getTarget());
        res.setOldData(log.getOldData());
        res.setNewData(log.getNewData());
        res.setCreatedAt(log.getCreatedAt());

        User admin = log.getAdmin();

        if (admin != null) {
            res.setAdminId(admin.getId());
            res.setAdminName(admin.getFullName());
            res.setAdminEmail(admin.getEmail());
        }

        return res;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }

        return value;
    }
}