package com.reliefconnection.controller;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reliefconnection.entity.AppUser;
import com.reliefconnection.repository.UserRepository;
import com.reliefconnection.service.MailService;

@RestController
@RequestMapping("/api")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository users;
    private final MailService mailService;
    private final Map<String, String> otps = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(UserRepository users, MailService mailService) {
        this.users = users;
        this.mailService = mailService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(text(body, "email"));
        if (email == null || email.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Email is required");
        }
        AppUser user = users.findByEmail(email).orElseGet(AppUser::new);
        boolean isNewUser = user.getId() == null;
        user.setName(text(body, "name"));
        user.setEmail(email);
        user.setPassword(text(body, "password"));
        user.setPhone(text(body, "phone"));

        AppUser saved = users.save(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User created");
        response.put("user", userResponse(saved));
        return ResponseEntity.status(isNewUser ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(text(body, "email"));
        String password = text(body, "password");

        return users.findByEmailAndPassword(email, password)
                .map(user -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Login successful");
                    response.put("user", userResponse(user));
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> error(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    }

    @PutMapping("/auth/me")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(text(body, "email"));
        if (email == null || email.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Email is required");
        }

        return users.findByEmail(email)
                .map(user -> {
                    user.setName(text(body, "name"));
                    user.setAge(text(body, "age"));
                    user.setJob(text(body, "job"));
                    user.setPhone(text(body, "phone"));
                    user.setLocation(text(body, "location"));
                    user.setPurpose(text(body, "purpose"));
                    user.setRating(text(body, "rating"));
                    user.setAbout(text(body, "about"));
                    user.setProfileImage(text(body, "profileImage"));

                    AppUser saved = users.save(user);
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Profile updated successfully");
                    response.put("user", userResponse(saved));
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(text(body, "email"));
        if (email == null || email.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (users.findByEmail(email).isEmpty()) {
            return error(HttpStatus.NOT_FOUND, "Email not found");
        }
        if (!mailService.canSend()) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is currently unavailable. Please try again later.");
        }

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        try {
            mailService.sendText(
                    email,
                    "Password Reset OTP - Relief Connection",
                    "Your OTP for password reset is: " + otp + ". It will expire soon.");
            otps.put(email, otp);
        } catch (Exception ex) {
            log.error("Failed to send password reset OTP email to {}", email, ex);
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Could not send OTP email right now. Please try again later.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "OTP sent to your email");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(text(body, "email"));
        String otp = text(body, "otp");
        String newPassword = text(body, "newPassword");

        if (email == null || email.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            return error(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }

        if (otp == null || !otp.equals(otps.get(email))) {
            return error(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }

        return users.findByEmail(email)
                .map(user -> {
                    user.setPassword(newPassword);
                    users.save(user);
                    otps.remove(email);

                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Password reset successful! You can now login.");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> error(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private Map<String, Object> userResponse(AppUser user) {
        Map<String, Object> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("age", user.getAge());
        response.put("job", user.getJob());
        response.put("phone", user.getPhone());
        response.put("location", user.getLocation());
        response.put("purpose", user.getPurpose());
        response.put("rating", user.getRating());
        response.put("about", user.getAbout());
        response.put("profileImage", user.getProfileImage());
        return response;
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
