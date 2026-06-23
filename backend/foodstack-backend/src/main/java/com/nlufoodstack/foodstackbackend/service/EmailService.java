package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.entity.Order;
import com.nlufoodstack.foodstackbackend.entity.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
        String subject = "Mã xác thực đặt lại mật khẩu - NLU FoodStack";
        String html = buildPasswordResetHtml(fullName, code);
        sendHtmlEmail(toEmail, subject, html);
    }

    public void sendRegisterVerificationCode(String toEmail, String fullName, String code) {
        String subject = "Mã xác thực đăng ký tài khoản - NLU FoodStack";
        String html = buildRegisterVerificationHtml(fullName, code);
        sendHtmlEmail(toEmail, subject, html);
    }

    public void sendOrderConfirmation(Order order, List<OrderItem> items) {
        if (order == null || order.user == null || order.user.getEmail() == null) {
            return;
        }

        String subject = "Xác nhận đơn hàng " + order.orderCode;
        String html = buildOrderConfirmationHtml(order, items);
        sendHtmlEmail(order.user.getEmail(), subject, html);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email HTML", e);
        }
    }

    private String buildPasswordResetHtml(String fullName, String code) {
        String content = ""
                + "<p style='margin:0 0 16px; color:#374151; font-size:15px;'>"
                + "Xin chào <b>" + escapeHtml(fullName) + "</b>,"
                + "</p>"

                + "<p style='margin:0 0 16px; color:#374151; font-size:15px;'>"
                + "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <b>NLU-FoodStack</b>."
                + "</p>"

                + "<div style='margin:24px 0; text-align:center;'>"
                + "  <div style='display:inline-block; background:linear-gradient(135deg,#ff6b35,#ff8a3d);"
                + "              color:#ffffff; font-size:32px; font-weight:800; letter-spacing:8px;"
                + "              padding:18px 28px; border-radius:14px;'>"
                + escapeHtml(code)
                + "  </div>"
                + "</div>"

                + "<p style='margin:0 0 12px; color:#374151; font-size:15px;'>"
                + "Mã này có hiệu lực trong <b>10 phút</b>."
                + "</p>"

                + "<p style='margin:0; color:#6b7280; font-size:14px;'>"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này."
                + "</p>";

        return buildEmailLayout(
                "Đặt lại mật khẩu",
                "Xác thực an toàn để tiếp tục sử dụng tài khoản của bạn",
                content
        );
    }

    private String buildRegisterVerificationHtml(String fullName, String code) {
        String content = ""
                + "<p style='margin:0 0 16px; color:#374151; font-size:15px;'>"
                + "Xin chào <b>" + escapeHtml(fullName) + "</b>,"
                + "</p>"

                + "<p style='margin:0 0 16px; color:#374151; font-size:15px;'>"
                + "Cảm ơn bạn đã đăng ký tài khoản tại <b>NLU-FoodStack</b>."
                + "</p>"

                + "<div style='margin:24px 0; text-align:center;'>"
                + "  <div style='display:inline-block; background:linear-gradient(135deg,#22c55e,#16a34a);"
                + "              color:#ffffff; font-size:32px; font-weight:800; letter-spacing:8px;"
                + "              padding:18px 28px; border-radius:14px;'>"
                + escapeHtml(code)
                + "  </div>"
                + "</div>"

                + "<p style='margin:0 0 12px; color:#374151; font-size:15px;'>"
                + "Mã xác thực có hiệu lực trong <b>10 phút</b>."
                + "</p>"

                + "<p style='margin:0; color:#6b7280; font-size:14px;'>"
                + "Vui lòng nhập mã này vào màn hình đăng ký để kích hoạt tài khoản."
                + "</p>";

        return buildEmailLayout(
                "Xác thực tài khoản",
                "Hoàn tất bước cuối để kích hoạt tài khoản của bạn",
                content
        );
    }

    private String buildOrderConfirmationHtml(Order order, List<OrderItem> items) {
        StringBuilder itemsHtml = new StringBuilder();

        for (OrderItem item : items) {
            itemsHtml.append(
                    "<tr>" +
                            "<td style='padding:12px; border-bottom:1px solid #f1f5f9; color:#111827;'>" + escapeHtml(item.foodName) + "</td>" +
                            "<td style='padding:12px; border-bottom:1px solid #f1f5f9; text-align:center; color:#111827;'>" + item.quantity + "</td>" +
                            "<td style='padding:12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#111827;'>" + formatMoney(item.unitPrice) + "</td>" +
                            "<td style='padding:12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#111827; font-weight:600;'>" + formatMoney(item.subtotal) + "</td>" +
                            "</tr>"
            );

            if (item.note != null && !item.note.isBlank()) {
                itemsHtml.append(
                        "<tr>" +
                                "<td colspan='4' style='padding:8px 12px 14px; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:13px;'>" +
                                "📝 Ghi chú: " + escapeHtml(item.note) +
                                "</td>" +
                                "</tr>"
                );
            }
        }

        String content = ""
                + "<p style='margin:0 0 16px; color:#374151; font-size:15px;'>"
                + "Xin chào <b>" + escapeHtml(order.user.getFullName()) + "</b>,"
                + "</p>"

                + "<p style='margin:0 0 18px; color:#374151; font-size:15px;'>"
                + "NLU-FoodStack đã nhận đơn hàng của bạn thành công 🎉"
                + "</p>"

                + "<div style='background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:16px; margin-bottom:20px;'>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>Mã đơn hàng:</b> " + escapeHtml(order.orderCode) + "</div>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>ID đơn hàng:</b> " + order.id + "</div>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>Người nhận:</b> " + escapeHtml(nullSafe(order.shippingName)) + "</div>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>Số điện thoại:</b> " + escapeHtml(nullSafe(order.shippingPhone)) + "</div>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>Địa chỉ giao hàng:</b> " + escapeHtml(nullSafe(order.shippingAddress)) + "</div>"
                + "  <div style='font-size:14px; color:#9a3412; margin-bottom:8px;'><b>Phương thức thanh toán:</b> " + escapeHtml(nullSafe(order.paymentMethod)) + "</div>"
                + "  <div style='font-size:14px; color:#9a3412;'><b>Trạng thái thanh toán:</b> " + escapeHtml(nullSafe(order.paymentStatus)) + "</div>"
                + "</div>"

                + "<h3 style='margin:0 0 12px; font-size:18px; color:#111827;'>Chi tiết món đã mua</h3>"

                + "<table style='width:100%; border-collapse:collapse; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;'>"
                + "  <thead>"
                + "    <tr style='background:#f97316;'>"
                + "      <th style='padding:12px; text-align:left; color:#ffffff; font-size:14px;'>Món ăn</th>"
                + "      <th style='padding:12px; text-align:center; color:#ffffff; font-size:14px;'>SL</th>"
                + "      <th style='padding:12px; text-align:right; color:#ffffff; font-size:14px;'>Đơn giá</th>"
                + "      <th style='padding:12px; text-align:right; color:#ffffff; font-size:14px;'>Thành tiền</th>"
                + "    </tr>"
                + "  </thead>"
                + "  <tbody>"
                +      itemsHtml
                + "  </tbody>"
                + "</table>"

                + "<div style='margin-top:20px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:16px;'>"
                + "  <div style='display:flex; justify-content:space-between; margin-bottom:8px; color:#374151;'>"
                + "    <span>Tạm tính:</span><b>" + formatMoney(order.subtotal) + "</b>"
                + "  </div>"
                + "  <div style='display:flex; justify-content:space-between; margin-bottom:8px; color:#374151;'>"
                + "    <span>Phí giao hàng:</span><b>" + formatMoney(order.shippingFee) + "</b>"
                + "  </div>"
                + "  <div style='display:flex; justify-content:space-between; margin-bottom:8px; color:#374151;'>"
                + "    <span>Giảm giá:</span><b>" + formatMoney(order.discountAmount) + "</b>"
                + "  </div>"
                + "  <div style='display:flex; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:1px dashed #cbd5e1; color:#111827; font-size:18px;'>"
                + "    <span><b>Tổng thanh toán:</b></span><b style='color:#ea580c;'>" + formatMoney(order.totalAmount) + "</b>"
                + "  </div>"
                + "</div>"

                + "<p style='margin:20px 0 0; color:#374151; font-size:15px;'>"
                + "Cảm ơn bạn đã đặt hàng tại <b>NLU-FoodStack</b> ❤️"
                + "</p>";

        return buildEmailLayout(
                "Xác nhận đơn hàng",
                "Đơn hàng của bạn đã được ghi nhận thành công",
                content
        );
    }

    private String buildEmailLayout(String title, String subtitle, String content) {
        return ""
                + "<!DOCTYPE html>"
                + "<html lang='vi'>"
                + "<head>"
                + "  <meta charset='UTF-8'>"
                + "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "  <title>" + escapeHtml(title) + "</title>"
                + "</head>"
                + "<body style='margin:0; padding:0; background:#f3f4f6; font-family:Arial,Helvetica,sans-serif;'>"
                + "  <div style='max-width:680px; margin:0 auto; padding:24px 16px;'>"

                + "    <div style='background:linear-gradient(135deg,#ef4444,#fb923c); border-radius:20px 20px 0 0; padding:28px 24px; color:#ffffff;'>"
                + "      <div style='display:inline-block; background:rgba(255,255,255,0.16); padding:8px 14px; border-radius:999px; font-size:13px; font-weight:700; margin-bottom:16px;'>"
                + "        🍔 NLU-FOODSTACK"
                + "      </div>"
                + "      <h1 style='margin:0 0 10px; font-size:30px; line-height:1.2;'>" + escapeHtml(title) + "</h1>"
                + "      <p style='margin:0; font-size:15px; line-height:1.6; color:#fff7ed;'>" + escapeHtml(subtitle) + "</p>"
                + "    </div>"

                + "    <div style='background:#ffffff; border-radius:0 0 20px 20px; padding:28px 24px; box-shadow:0 8px 24px rgba(0,0,0,0.08);'>"
                +          content
                + "    </div>"

                + "    <div style='text-align:center; padding:18px 8px; color:#9ca3af; font-size:13px; line-height:1.6;'>"
                + "      Email này được gửi tự động từ hệ thống NLU-FoodStack.<br>"
                + "      Vui lòng không trả lời trực tiếp email này."
                + "    </div>"

                + "  </div>"
                + "</body>"
                + "</html>";
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String formatMoney(BigDecimal value) {
        BigDecimal safeValue = value == null ? BigDecimal.ZERO : value;
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return formatter.format(safeValue);
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}