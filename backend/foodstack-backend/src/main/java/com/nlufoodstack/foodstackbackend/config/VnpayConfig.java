package com.nlufoodstack.foodstackbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VnpayConfig {
    @Value("${vnpay.tmn-code:}") public String tmnCode;
    @Value("${vnpay.hash-secret:}") public String hashSecret;
    @Value("${vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") public String payUrl;
    @Value("${vnpay.return-url:http://localhost:3000/vnpay-return}") public String returnUrl;
}
