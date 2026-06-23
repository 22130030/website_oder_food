package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetCode(String toEmail, String fullName, String code) {
        SimpleMailMessage message = baseMessage(toEmail, "Mã xác thực đặt lại mật khẩu NLU-FoodStack");
        message.setText("Xin chào " + fullName + ",\n\n"
                + "Mã xác thực đặt lại mật khẩu của bạn là: " + code + "\n"
                + "Mã này có hiệu lực trong 10 phút.\n\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n"
                + "NLU-FoodStack");
        mailSender.send(message);
    }

    public void sendRegisterVerificationCode(String toEmail, String fullName, String code) {
        SimpleMailMessage message = baseMessage(toEmail, "Mã xác thực đăng ký tài khoản NLU-FoodStack");
        message.setText("Xin chào " + fullName + ",\n\n"
                + "Mã xác thực đăng ký tài khoản của bạn là: " + code + "\n"
                + "Mã này có hiệu lực trong 10 phút.\n\n"
                + "Nhập mã này trên màn hình đăng ký để kích hoạt tài khoản.\n\n"
                + "NLU-FoodStack");
        mailSender.send(message);
    }

    public void sendOrderConfirmation(Order order, List<OrderItem> items) {
        if (order == null || order.user == null || order.user.getEmail() == null) {
            return;
        }

        StringBuilder body = new StringBuilder();

        body.append("Xin chào ").append(order.user.getFullName()).append(",\n\n");
        body.append("NLU-FoodStack đã nhận đơn hàng của bạn.\n\n");

        body.append("Mã đơn hàng: ").append(order.orderCode).append("\n");
        body.append("ID đơn hàng: ").append(order.id).append("\n");
        body.append("Người nhận: ").append(nullSafe(order.shippingName)).append("\n");
        body.append("Số điện thoại: ").append(nullSafe(order.shippingPhone)).append("\n");
        body.append("Địa chỉ giao hàng: ").append(nullSafe(order.shippingAddress)).append("\n");
        body.append("Phương thức thanh toán: ").append(nullSafe(order.paymentMethod)).append("\n");
        body.append("Trạng thái thanh toán: ").append(nullSafe(order.paymentStatus)).append("\n\n");

        body.append("Chi tiết món đã mua:\n");

        for (OrderItem item : items) {
            body.append("- ").append(item.foodName)
                    .append(" | SL: ").append(item.quantity)
                    .append(" | Đơn giá: ").append(formatMoney(item.unitPrice))
                    .append(" | Thành tiền: ").append(formatMoney(item.subtotal));

            if (item.note != null && !item.note.isBlank()) {
                body.append(" | Ghi chú: ").append(item.note);
            }

            body.append("\n");
        }

        body.append("\nTạm tính: ").append(formatMoney(order.subtotal)).append("\n");
        body.append("Phí giao hàng: ").append(formatMoney(order.shippingFee)).append("\n");
        body.append("Giảm giá: ").append(formatMoney(order.discountAmount)).append("\n");
        body.append("Tổng thanh toán: ").append(formatMoney(order.totalAmount)).append("\n\n");

        body.append("Cảm ơn bạn đã đặt hàng tại NLU-FoodStack!");

        SimpleMailMessage message = baseMessage(order.user.getEmail(), "Xác nhận đơn hàng " + order.orderCode);
        message.setText(body.toString());

        mailSender.send(message);
    }

    private SimpleMailMessage baseMessage(String toEmail, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();

        if (fromEmail != null && !fromEmail.isBlank()) {
            message.setFrom(fromEmail);
        }

        message.setTo(toEmail);
        message.setSubject(subject);

        return message;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String formatMoney(BigDecimal value) {
        BigDecimal safeValue = value == null ? BigDecimal.ZERO : value;
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return formatter.format(safeValue);
    }
}