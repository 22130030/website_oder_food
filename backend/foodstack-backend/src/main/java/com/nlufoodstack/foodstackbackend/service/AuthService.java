package com.nlufoodstack.foodstackbackend.service;

import com.nlufoodstack.foodstackbackend.dto.reponse.AuthResponse;
import com.nlufoodstack.foodstackbackend.dto.request.ForgotPasswordRequest;
import com.nlufoodstack.foodstackbackend.dto.request.LoginRequest;
import com.nlufoodstack.foodstackbackend.dto.request.RegisterRequest;
import com.nlufoodstack.foodstackbackend.dto.request.ResetPasswordRequest;
import com.nlufoodstack.foodstackbackend.dto.request.VerifyRegisterCodeRequest;
import com.nlufoodstack.foodstackbackend.dto.request.VerifyResetCodeRequest;
import com.nlufoodstack.foodstackbackend.entity.EmailVerificationCode;
import com.nlufoodstack.foodstackbackend.entity.PasswordResetCode;
import com.nlufoodstack.foodstackbackend.entity.Role;
import com.nlufoodstack.foodstackbackend.entity.User;
import com.nlufoodstack.foodstackbackend.repository.EmailVerificationCodeRepository;
import com.nlufoodstack.foodstackbackend.repository.PasswordResetCodeRepository;
import com.nlufoodstack.foodstackbackend.repository.UserRepository;
import com.nlufoodstack.foodstackbackend.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final EmailVerificationCodeRepository emailVerificationCodeRepository;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       PasswordResetCodeRepository passwordResetCodeRepository,
                       EmailVerificationCodeRepository emailVerificationCodeRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.emailVerificationCodeRepository = emailVerificationCodeRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.getPhone() == null || request.getPhone().isBlank() ? null : request.getPhone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.CUSTOMER);
        user.setIsActive(false);
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        String code = generateSixDigitCode();

        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setUser(savedUser);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCode.setUsed(false);

        emailVerificationCodeRepository.save(verificationCode);

        emailService.sendRegisterVerificationCode(savedUser.getEmail(), savedUser.getFullName(), code);
    }

    @Transactional
    public AuthResponse verifyRegisterCode(VerifyRegisterCodeRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new IllegalArgumentException("Email chưa được đăng ký trong hệ thống"));

        if (Boolean.TRUE.equals(user.getEmailVerified()) && Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Tài khoản đã được xác thực trước đó");
        }

        EmailVerificationCode verificationCode = emailVerificationCodeRepository
                .findTopByUserAndCodeAndUsedFalseOrderByCreatedAtDesc(user, request.getCode())
                .orElseThrow(() -> new IllegalArgumentException("Mã xác thực không đúng"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã xác thực đã hết hạn");
        }

        verificationCode.setUsed(true);
        emailVerificationCodeRepository.save(verificationCode);

        user.setEmailVerified(true);
        user.setIsActive(true);
        userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizeEmail(request.getEmail()), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Tài khoản chưa xác thực email. Vui lòng kiểm tra email để lấy mã xác thực.");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Tài khoản đang bị khóa hoặc chưa được kích hoạt");
        }

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Transactional
    public void sendForgotPasswordCode(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email chưa được đăng ký trong hệ thống"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Tài khoản đang bị khóa hoặc ngừng hoạt động");
        }

        String code = generateSixDigitCode();

        PasswordResetCode resetCode = new PasswordResetCode();
        resetCode.setUser(user);
        resetCode.setCode(code);
        resetCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetCode.setUsed(false);

        passwordResetCodeRepository.save(resetCode);

        emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code);
    }

    public void verifyResetCode(VerifyResetCodeRequest request) {
        User user = findUserByEmail(request.getEmail());
        validateResetCode(user, request.getCode());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = findUserByEmail(request.getEmail());
        PasswordResetCode resetCode = validateResetCode(user, request.getCode());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetCode.setUsed(true);
        passwordResetCodeRepository.save(resetCode);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new IllegalArgumentException("Email chưa được đăng ký trong hệ thống"));
    }

    private PasswordResetCode validateResetCode(User user, String code) {
        PasswordResetCode resetCode = passwordResetCodeRepository
                .findTopByUserAndCodeAndUsedFalseOrderByCreatedAtDesc(user, code)
                .orElseThrow(() -> new IllegalArgumentException("Mã xác thực không đúng"));

        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã xác thực đã hết hạn");
        }

        return resetCode;
    }

    private String generateSixDigitCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}