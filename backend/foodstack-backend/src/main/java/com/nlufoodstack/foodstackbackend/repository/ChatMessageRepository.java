package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByCustomerIdOrderBySentAtAsc(Long customerId);

    List<ChatMessage> findAllByOrderBySentAtDesc();

    long countByCustomerIdAndIsReadFalseAndSenderId(Long customerId, Long senderId);

    @Query("""
        SELECT COUNT(m)
        FROM ChatMessage m
        WHERE m.isRead = false
        AND m.senderId = m.customerId
    """)
    long countUnreadForAdmin();

    @Query("""
        SELECT COUNT(m)
        FROM ChatMessage m
        WHERE m.customerId = :customerId
        AND m.isRead = false
        AND m.senderId <> :customerId
    """)
    long countUnreadForCustomer(@Param("customerId") Long customerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.customerId = :customerId
        AND m.senderId = :customerId
        AND m.isRead = false
    """)
    int markCustomerMessagesAsReadForAdmin(@Param("customerId") Long customerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.customerId = :customerId
        AND m.senderId <> :customerId
        AND m.isRead = false
    """)
    int markAdminMessagesAsReadForCustomer(@Param("customerId") Long customerId);
}