package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByVnpayTxnRef(String vnpayTxnRef);

    @Query("SELECT pt FROM PaymentTransaction pt " +
            "JOIN FETCH pt.order o " +
            "JOIN FETCH o.user " +
            "WHERE pt.vnpayTxnRef = :vnpayTxnRef")
    Optional<PaymentTransaction> findByVnpayTxnRefWithOrderAndUser(
            @Param("vnpayTxnRef") String vnpayTxnRef
    );

    @Query("SELECT o.user.id FROM PaymentTransaction pt JOIN pt.order o WHERE pt.vnpayTxnRef = :vnpayTxnRef")
    Optional<Long> findUserIdByVnpayTxnRef(@Param("vnpayTxnRef") String vnpayTxnRef);
}