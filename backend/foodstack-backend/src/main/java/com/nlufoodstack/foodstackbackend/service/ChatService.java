package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.reponse.ChatConversationResponse;
import com.nlufoodstack.foodstackbackend.dto.reponse.ChatMessageResponse;
import com.nlufoodstack.foodstackbackend.dto.request.ChatMessageRequest;
import com.nlufoodstack.foodstackbackend.entity.ChatMessage;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.ChatMessageRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.nlufoodstack.foodstackbackend.util.ChatEncryptionUtil;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatEncryptionUtil chatEncryptionUtil;

    @Transactional
    public ChatMessageResponse saveMessage(ChatMessageRequest request) {
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));

        userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

        String messageType = request.getMessageType() != null
                ? request.getMessageType()
                : "TEXT";

        String contentToSave = request.getContent();

        if ("TEXT".equalsIgnoreCase(messageType) && contentToSave != null && !contentToSave.isBlank()) {
            contentToSave = chatEncryptionUtil.encrypt(contentToSave);
        }

        ChatMessage message = new ChatMessage();
        message.setCustomerId(request.getCustomerId());
        message.setSenderId(request.getSenderId());
        message.setContent(contentToSave);
        message.setMessageType(messageType.toUpperCase());
        message.setImageUrl(request.getImageUrl());
        message.setIsRead(false);

        ChatMessage saved = chatMessageRepository.save(message);

        return new ChatMessageResponse(
                saved.getId(),
                saved.getCustomerId(),
                saved.getSenderId(),
                sender.getFullName(),
                sender.getRole().name(),
                request.getContent(),
                saved.getIsRead(),
                saved.getSentAt(),
                saved.getMessageType(),
                saved.getImageUrl()
        );
    }

    public List<ChatMessageResponse> getMessagesByCustomer(Long customerId) {
        return chatMessageRepository.findByCustomerIdOrderBySentAtAsc(customerId)
                .stream()
                .map(message -> {
                    User sender = userRepository.findById(message.getSenderId()).orElse(null);

                    String decryptedContent = message.getContent();

                    if ("TEXT".equalsIgnoreCase(message.getMessageType())) {
                        decryptedContent = chatEncryptionUtil.decrypt(message.getContent());
                    }

                    return new ChatMessageResponse(
                            message.getId(),
                            message.getCustomerId(),
                            message.getSenderId(),
                            sender != null ? sender.getFullName() : "Unknown",
                            sender != null ? sender.getRole().name() : "UNKNOWN",
                            decryptedContent,
                            message.getIsRead(),
                            message.getSentAt(),
                            message.getMessageType(),
                            message.getImageUrl()
                    );
                })
                .toList();
    }

    public List<ChatConversationResponse> getAllConversations() {
        List<ChatMessage> messages = chatMessageRepository.findAllByOrderBySentAtDesc();

        Set<Long> seenCustomerIds = new HashSet<>();
        List<ChatConversationResponse> result = new ArrayList<>();

        for (ChatMessage message : messages) {
            Long customerId = message.getCustomerId();

            if (seenCustomerIds.contains(customerId)) {
                continue;
            }

            seenCustomerIds.add(customerId);

            User customer = userRepository.findById(customerId).orElse(null);

            if (customer == null) {
                continue;
            }

            long unreadCount = chatMessageRepository
                    .countByCustomerIdAndIsReadFalseAndSenderId(customerId, customerId);

//            String decryptedContent = chatEncryptionUtil.decrypt(message.getContent());
            String lastMessage;

            if ("IMAGE".equalsIgnoreCase(message.getMessageType())) {
                lastMessage = "[Hình ảnh]";
            } else {
                lastMessage = chatEncryptionUtil.decrypt(message.getContent());
            }

            result.add(new ChatConversationResponse(
                    customer.getId(),
                    customer.getFullName(),
                    customer.getEmail(),
                    lastMessage,
                    message.getSentAt(),
                    unreadCount
            ));
        }

        return result;
    }

    public long getAdminUnreadCount() {
        return chatMessageRepository.countUnreadForAdmin();
    }

    public long getCustomerUnreadCount(Long customerId) {
        return chatMessageRepository.countUnreadForCustomer(customerId);
    }

    @Transactional
    public int markConversationAsReadForAdmin(Long customerId) {
        int updated = chatMessageRepository.markCustomerMessagesAsReadForAdmin(customerId);
        System.out.println("[MARK READ] customerId=" + customerId + " => updated " + updated + " rows");
        return updated;
    }

    @Transactional
    public int markConversationAsReadForCustomer(Long customerId) {
        return chatMessageRepository.markAdminMessagesAsReadForCustomer(customerId);
    }
}