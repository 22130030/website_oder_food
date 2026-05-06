package com.nlufoodstack.foodstackbackend.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long customerId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private Boolean isRead;
    private LocalDateTime sentAt;
    private String messageType;
    private String imageUrl;
}