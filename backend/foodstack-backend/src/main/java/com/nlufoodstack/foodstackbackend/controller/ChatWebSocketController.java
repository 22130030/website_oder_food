package com.nlufoodstack.foodstackbackend.controller;

import com.nlufoodstack.foodstackbackend.dto.reponse.ChatMessageResponse;
import com.nlufoodstack.foodstackbackend.dto.request.ChatMessageRequest;
import com.nlufoodstack.foodstackbackend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request) {
        ChatMessageResponse savedMessage = chatService.saveMessage(request);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getCustomerId(),
                savedMessage
        );

        messagingTemplate.convertAndSend(
                "/topic/admin/conversations",
                savedMessage
        );
    }
}