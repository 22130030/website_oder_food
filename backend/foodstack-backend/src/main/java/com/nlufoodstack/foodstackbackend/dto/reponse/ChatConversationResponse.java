package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ChatConversationResponse {
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String lastMessage;
    private LocalDateTime lastSentAt;
    private Long unreadCount;
}