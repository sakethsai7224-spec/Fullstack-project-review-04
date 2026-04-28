package com.reliefconnection.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class MailService {
    private static final String PROVIDER_RESEND = "resend";
    private static final String PROVIDER_SMTP = "smtp";

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String from;
    private final String provider;
    private final String resendApiKey;
    private final String smtpUsername;
    private final String smtpPassword;

    public MailService(
            JavaMailSender mailSender,
            ObjectMapper objectMapper,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:}") String from,
            @Value("${app.mail.provider:smtp}") String provider,
            @Value("${app.mail.resend.api-key:}") String resendApiKey,
            @Value("${spring.mail.username:}") String smtpUsername,
            @Value("${spring.mail.password:}") String smtpPassword) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.enabled = enabled;
        this.from = from;
        this.provider = provider == null ? PROVIDER_SMTP : provider.trim().toLowerCase();
        this.resendApiKey = resendApiKey;
        this.smtpUsername = smtpUsername;
        this.smtpPassword = smtpPassword;
    }

    public boolean canSend() {
        if (!enabled || from == null || from.isBlank()) {
            return false;
        }

        if (PROVIDER_RESEND.equals(provider)) {
            return resendApiKey != null && !resendApiKey.isBlank();
        }

        return smtpUsername != null && !smtpUsername.isBlank()
                && smtpPassword != null && !smtpPassword.isBlank();
    }

    public void sendText(String recipients, String subject, String body) {
        if (!canSend()) {
            return;
        }

        String[] to = Arrays.stream(recipients.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .toArray(String[]::new);

        if (to.length == 0) {
            return;
        }

        if (PROVIDER_RESEND.equals(provider)) {
            sendWithResend(to, subject, body);
            return;
        }

        sendWithSmtp(to, subject, body);
    }

    private void sendWithSmtp(String[] to, String subject, String body) {
        MailException lastException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                return;
            } catch (MailException ex) {
                lastException = ex;
                if (attempt < 3) {
                    try {
                        Thread.sleep(1000L * attempt);
                    } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("SMTP email retry was interrupted", interruptedException);
                    }
                }
            }
        }

        if (lastException != null) {
            throw lastException;
        }
    }

    private void sendWithResend(String[] to, String subject, String body) {
        try {
            Map<String, Object> payload = Map.of(
                    "from", from,
                    "to", List.of(to),
                    "subject", subject,
                    "text", body,
                    "html", toHtml(body));

            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new IllegalStateException("Resend email request failed with status "
                        + response.statusCode() + ": " + response.body());
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to call Resend API", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Resend email sending was interrupted", ex);
        }
    }

    private String toHtml(String body) {
        return "<pre style=\"font-family:Arial,sans-serif;white-space:pre-wrap;\">"
                + escapeHtml(body)
                + "</pre>";
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
