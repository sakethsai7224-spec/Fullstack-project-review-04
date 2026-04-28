package com.reliefconnection.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reliefconnection.service.MailService;

@RestController
@RequestMapping("/api")
public class NotificationController {
    private final MailService mailService;

    public NotificationController(MailService mailService) {
        this.mailService = mailService;
    }

    @PostMapping("/notify-order")
    public ResponseEntity<Map<String, Object>> notifyOrder(@RequestBody Map<String, Object> body) {
        String recipientEmail = text(body, "recipientEmail");
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Missing recipient email");
        }
        if (!mailService.canSend()) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is currently unavailable");
        }

        String donorName = fallback(text(body, "donorName"), "A kind donor");
        String itemName = fallback(text(body, "itemName"), "your requested item");
        String quantity = fallback(text(body, "quantity"), "");

        try {
            mailService.sendText(
                    recipientEmail,
                    "Good News! Someone is supporting your request!",
                    "Hello,\n\n" + donorName + " has clicked \"Order Item\" for your request of "
                            + quantity + " " + itemName + ".\n\nThank you,\nThe Relief Connection Team");
        } catch (Exception ex) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Could not send notification email right now");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Notification sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/notify-receipt")
    public ResponseEntity<Map<String, Object>> notifyReceipt(@RequestBody Map<String, Object> body) {
        List<String> emails = new ArrayList<>();
        addEmail(emails, text(body, "recipientEmail"));
        addEmail(emails, text(body, "donorEmail"));

        if (emails.isEmpty()) {
            return error(HttpStatus.BAD_REQUEST, "No emails provided");
        }
        if (!mailService.canSend()) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is currently unavailable");
        }

        String item = fallback(text(body, "item"), "item");
        String quantity = fallback(text(body, "quantity"), "");
        String serialId = fallback(text(body, "serialId"), "N/A");

        try {
            mailService.sendText(
                    String.join(",", emails),
                    "Official Donation Receipt - Relief Connection",
                    "Receipt for " + item + " (Qty: " + quantity + "). Serial No: " + serialId
                            + ". Successfully transferred on " + LocalDate.now() + ". Thank you!");
        } catch (Exception ex) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "Could not send receipt email right now");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Receipt sent successfully");
        return ResponseEntity.ok(response);
    }

    private void addEmail(List<String> emails, String email) {
        if (email != null && !email.isBlank() && !"N/A".equalsIgnoreCase(email)) {
            emails.add(email);
        }
    }

    private String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
