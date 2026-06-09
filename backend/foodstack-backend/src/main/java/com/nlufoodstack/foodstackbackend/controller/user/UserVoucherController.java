package com.nlufoodstack.foodstackbackend.controller.user;

import com.nlufoodstack.foodstackbackend.dto.reponse.VoucherApplyResponse;
import com.nlufoodstack.foodstackbackend.dto.request.VoucherApplyRequest;
import com.nlufoodstack.foodstackbackend.entity.Voucher;
import com.nlufoodstack.foodstackbackend.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/user/vouchers")
@RequiredArgsConstructor
public class UserVoucherController {

    private final VoucherRepository voucherRepository;

    @PostMapping("/apply")
    public ResponseEntity<?> applyVoucher(@RequestBody VoucherApplyRequest request) {
        try {
            BigDecimal orderAmount = money(request.getOrderAmount());

            if (request.getCode() == null || request.getCode().trim().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Vui lòng nhập mã voucher"
                ));
            }

            Voucher voucher = voucherRepository.findByCodeIgnoreCase(normalizeCode(request.getCode()))
                    .orElseThrow(() -> new IllegalArgumentException("Mã voucher không tồn tại"));

            validateVoucher(voucher, orderAmount);

            BigDecimal discountAmount = calculateDiscount(voucher, orderAmount);
            BigDecimal finalAmount = orderAmount.subtract(discountAmount);

            if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
                finalAmount = BigDecimal.ZERO;
            }

            VoucherApplyResponse response = new VoucherApplyResponse();
            response.setVoucherId(voucher.getId());
            response.setCode(voucher.getCode());
            response.setName(voucher.getName());
            response.setDiscountType(voucher.getDiscountType());
            response.setDiscountValue(voucher.getDiscountValue());
            response.setDiscountAmount(discountAmount);
            response.setFinalAmount(finalAmount);
            response.setMessage("Áp dụng voucher thành công");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi áp dụng voucher",
                    "error", e.getMessage()
            ));
        }
    }

    private void validateVoucher(Voucher voucher, BigDecimal orderAmount) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getActive())) {
            throw new IllegalArgumentException("Voucher đã bị tạm tắt");
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new IllegalArgumentException("Voucher chưa đến thời gian sử dụng");
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new IllegalArgumentException("Voucher đã hết hạn");
        }

        int quantity = voucher.getQuantity() == null ? 0 : voucher.getQuantity();
        int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();

        if (usedCount >= quantity) {
            throw new IllegalArgumentException("Voucher đã hết lượt sử dụng");
        }

        BigDecimal minOrderAmount = money(voucher.getMinOrderAmount());

        if (orderAmount.compareTo(minOrderAmount) < 0) {
            throw new IllegalArgumentException(
                    "Đơn hàng cần tối thiểu " +
                            minOrderAmount.setScale(0, RoundingMode.HALF_UP).toPlainString() +
                            "đ để dùng voucher này"
            );
        }
    }

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount) {
        String type = voucher.getDiscountType() == null
                ? ""
                : voucher.getDiscountType().toUpperCase(Locale.ROOT);

        BigDecimal discountValue = money(voucher.getDiscountValue());

        if ("PERCENT".equals(type)) {
            BigDecimal discount = orderAmount
                    .multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal maxDiscount = money(voucher.getMaxDiscountAmount());

            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
                return maxDiscount;
            }

            return discount;
        }

        if ("FIXED".equals(type)) {
            return discountValue.min(orderAmount);
        }

        return BigDecimal.ZERO;
    }

    private String normalizeCode(String code) {
        return code == null
                ? ""
                : code.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}