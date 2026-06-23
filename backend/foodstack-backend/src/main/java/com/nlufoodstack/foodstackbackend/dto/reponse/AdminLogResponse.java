package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminLogResponse {
    private Long id;

    private Long adminId;
    private String adminName;
    private String adminEmail;

    private String action;
    private String target;

    private String oldData;
    private String newData;

    private LocalDateTime createdAt;
}
