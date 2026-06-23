package com.nlufoodstack.foodstackbackend.controller.admin;

import com.nlufoodstack.foodstackbackend.dto.reponse.VoucherResponse;
import com.nlufoodstack.foodstackbackend.dto.request.VoucherRequest;
import com.nlufoodstack.foodstackbackend.entity.Voucher;
import com.nlufoodstack.foodstackbackend.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nlufoodstack.foodstackbackend.annotation.AdminLogAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final VoucherRepository voucherRepository;

    @GetMapping
    public ResponseEntity<?> getAllVouchers(
            @RequestParam(required = false) String keyword
    ) {
        String search = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        List<VoucherResponse> vouchers = voucherRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(voucher -> {
                    if (search.isBlank()) return true;

                    String code = safe(voucher.getCode()).toLowerCase(Locale.ROOT);
                    String name = safe(voucher.getName()).toLowerCase(Locale.ROOT);
                    String description = safe(voucher.getDescription()).toLowerCase(Locale.ROOT);

                    return code.contains(search)
                            || name.contains(search)
                            || description.contains(search);
                })
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(vouchers);
    }

    @PostMapping
    @AdminLogAction(action = "CREATE", target = "VOUCHER")
    public ResponseEntity<?> createVoucher(@RequestBody VoucherRequest request) {
        try {
            validateRequest(request, null);

            String code = normalizeCode(request.getCode());

            if (voucherRepository.existsByCodeIgnoreCase(code)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Mã voucher đã tồn tại"
                ));
            }

            Voucher voucher = new Voucher();
            applyRequest(voucher, request);

            Voucher saved = voucherRepository.save(voucher);

            return ResponseEntity.ok(toResponse(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi tạo voucher",
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @AdminLogAction(action = "UPDATE", target = "VOUCHER")
    public ResponseEntity<?> updateVoucher(
            @PathVariable Long id,
            @RequestBody VoucherRequest request
    ) {
        try {
            Voucher voucher = voucherRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));

            validateRequest(request, id);

            String code = normalizeCode(request.getCode());

            voucherRepository.findByCodeIgnoreCase(code).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new IllegalArgumentException("Mã voucher đã tồn tại");
                }
            });

            applyRequest(voucher, request);

            Voucher saved = voucherRepository.save(voucher);

            return ResponseEntity.ok(toResponse(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi cập nhật voucher",
                    "error", e.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}/toggle")
    @AdminLogAction(action = "TOGGLE", target = "VOUCHER")
    public ResponseEntity<?> toggleVoucher(@PathVariable Long id) {
        try {
            Voucher voucher = voucherRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));

            voucher.setActive(!Boolean.TRUE.equals(voucher.getActive()));

            Voucher saved = voucherRepository.save(voucher);

            return ResponseEntity.ok(toResponse(saved));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi bật/tắt voucher",
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @AdminLogAction(action = "DELETE", target = "VOUCHER")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        try {
            Voucher voucher = voucherRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));

            if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
                voucher.setActive(false);
                voucherRepository.save(voucher);

                return ResponseEntity.ok(Map.of(
                        "message", "Voucher đã có người dùng nên không xóa, hệ thống đã tạm tắt voucher"
                ));
            }

            voucherRepository.delete(voucher);

            return ResponseEntity.ok(Map.of(
                    "message", "Xóa voucher thành công"
            ));
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi xóa voucher",
                    "error", e.getMessage()
            ));
        }
    }

    private void validateRequest(VoucherRequest request, Long currentId) {
        if (request.getCode() == null || request.getCode().trim().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã voucher");
        }

        if (request.getName() == null || request.getName().trim().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập tên voucher");
        }

        String type = normalizeType(request.getDiscountType());

        if (!"PERCENT".equals(type) && !"FIXED".equals(type)) {
            throw new IllegalArgumentException("Loại giảm giá không hợp lệ");
        }

        BigDecimal discountValue = money(request.getDiscountValue());

        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá trị giảm phải lớn hơn 0");
        }

        if ("PERCENT".equals(type) && discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Giảm theo phần trăm không được vượt quá 100%");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng voucher phải lớn hơn 0");
        }

        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày bắt đầu");
        }

        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc");
        }

        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }

    private void applyRequest(Voucher voucher, VoucherRequest request) {
        voucher.setCode(normalizeCode(request.getCode()));
        voucher.setName(request.getName().trim());
        voucher.setDescription(request.getDescription());

        voucher.setDiscountType(normalizeType(request.getDiscountType()));
        voucher.setDiscountValue(money(request.getDiscountValue()));
        voucher.setMaxDiscountAmount(money(request.getMaxDiscountAmount()));
        voucher.setMinOrderAmount(money(request.getMinOrderAmount()));

        voucher.setQuantity(request.getQuantity());
        voucher.setActive(request.getActive() == null || request.getActive());

        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
    }

    private VoucherResponse toResponse(Voucher voucher) {
        VoucherResponse response = new VoucherResponse();

        response.setId(voucher.getId());
        response.setCode(voucher.getCode());
        response.setName(voucher.getName());
        response.setDescription(voucher.getDescription());
        response.setDiscountType(voucher.getDiscountType());

        response.setDiscountValue(voucher.getDiscountValue());
        response.setMaxDiscountAmount(voucher.getMaxDiscountAmount());
        response.setMinOrderAmount(voucher.getMinOrderAmount());

        response.setQuantity(voucher.getQuantity());
        response.setUsedCount(voucher.getUsedCount());

        int remaining = Math.max(
                0,
                safeInt(voucher.getQuantity()) - safeInt(voucher.getUsedCount())
        );

        response.setRemainingQuantity(remaining);
        response.setActive(voucher.getActive());
        response.setDisplayStatus(getDisplayStatus(voucher));

        response.setStartDate(voucher.getStartDate());
        response.setEndDate(voucher.getEndDate());
        response.setCreatedAt(voucher.getCreatedAt());
        response.setUpdatedAt(voucher.getUpdatedAt());

        return response;
    }

    private String getDisplayStatus(Voucher voucher) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getActive())) {
            return "Tạm tắt";
        }

        if (safeInt(voucher.getUsedCount()) >= safeInt(voucher.getQuantity())) {
            return "Hết lượt";
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return "Sắp diễn ra";
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            return "Hết hạn";
        }

        return "Đang hoạt động";
    }

    private String normalizeCode(String code) {
        return code == null
                ? ""
                : code.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private String normalizeType(String type) {
        return type == null
                ? ""
                : type.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}