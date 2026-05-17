package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.config.VnpayConfig;
import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.util.VnpayUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnpayService {
    private final VnpayConfig config;
    public VnpayService(VnpayConfig config) { this.config = config; }

    public String createPaymentUrl(Order order, HttpServletRequest request) {
        String txnRef = order.orderCode;
        BigDecimal amount = order.totalAmount.multiply(BigDecimal.valueOf(100));
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.tmnCode);
        params.put("vnp_Amount", amount.toBigInteger().toString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.orderCode);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", config.returnUrl);
        params.put("vnp_IpAddr", request.getRemoteAddr());
        params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        String hashData = VnpayUtil.buildQuery(params, false);
        String secureHash = VnpayUtil.hmacSHA512(config.hashSecret, hashData);
        return config.payUrl + "?" + VnpayUtil.buildQuery(params, true) + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyReturn(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        Map<String, String> copy = new HashMap<>(params);
        copy.remove("vnp_SecureHash"); copy.remove("vnp_SecureHashType");
        String hashData = VnpayUtil.buildQuery(copy, false);
        return VnpayUtil.hmacSHA512(config.hashSecret, hashData).equalsIgnoreCase(receivedHash);
    }
}
