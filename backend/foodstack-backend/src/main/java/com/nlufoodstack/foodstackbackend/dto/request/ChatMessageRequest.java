package com.nlufoodstack.foodstackbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {

    @NotNull
    private Long customerId;

    @NotNull
    private Long senderId;

    @NotBlank
    private String content;

    private String messageType;

    private String imageUrl;
}