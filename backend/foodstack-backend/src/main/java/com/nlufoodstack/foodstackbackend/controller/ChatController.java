package com.nlufoodstack.foodstackbackend.controller;

import com.nlufoodstack.foodstackbackend.dto.reponse.ChatConversationResponse;
import com.nlufoodstack.foodstackbackend.dto.reponse.ChatMessageResponse;
import com.nlufoodstack.foodstackbackend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/customer/{customerId}")
    public List<ChatMessageResponse> getMessagesByCustomer(@PathVariable Long customerId) {
        return chatService.getMessagesByCustomer(customerId);
    }

    @GetMapping("/admin/conversations")
    public List<ChatConversationResponse> getAllConversations() {
        return chatService.getAllConversations();
    }
    @GetMapping("/admin/unread-count")
    public long getAdminUnreadCount() {
        return chatService.getAdminUnreadCount();
    }

    @GetMapping("/customer/{customerId}/unread-count")
    public long getCustomerUnreadCount(@PathVariable Long customerId) {
        return chatService.getCustomerUnreadCount(customerId);
    }

    @PatchMapping("/admin/conversations/{customerId}/read")
    public int markConversationAsReadForAdmin(@PathVariable Long customerId) {
       return chatService.markConversationAsReadForAdmin(customerId);
    }

    @PatchMapping("/customer/{customerId}/read")
    public int markConversationAsReadForCustomer(@PathVariable Long customerId) {
       return chatService.markConversationAsReadForCustomer(customerId);
    }
}