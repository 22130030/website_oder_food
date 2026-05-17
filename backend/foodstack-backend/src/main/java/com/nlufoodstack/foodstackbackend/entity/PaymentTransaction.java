package com.nlufoodstack.foodstackbackend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name="order_id") public Order order;
    @Column(name="payment_method") public String paymentMethod = "COD";
    @Column(name="vnpay_txn_ref") public String vnpayTxnRef;
    @Column(name="gateway_transaction_no") public String gatewayTransactionNo;
    @Column(name="bank_code") public String bankCode;
    @Column(name="pay_date") public String payDate;
    @Column(name="response_code") public String responseCode;
    public BigDecimal amount;
    public String status = "PENDING";
    @Column(name="raw_response", columnDefinition="LONGTEXT") public String rawResponse;
    @Column(name="created_at") public LocalDateTime createdAt = LocalDateTime.now();
    @Column(name="updated_at") public LocalDateTime updatedAt = LocalDateTime.now();
}
