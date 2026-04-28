package com.reliefconnection.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reliefconnection.entity.ReliefRecord;
import com.reliefconnection.repository.ReliefRecordRepository;

@RestController
@RequestMapping("/api")
public class RecordController {
    private final ReliefRecordRepository records;
    private final ObjectMapper objectMapper;

    public RecordController(ReliefRecordRepository records, ObjectMapper objectMapper) {
        this.records = records;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> getDatabase(@RequestParam String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Missing userEmail");
        }

        List<ReliefRecord> visibleRecords = isAdmin(userEmail)
                ? records.findAll()
                : records.findVisibleForUser(userEmail, List.of("Request", "Donation"));

        Map<String, Object> database = new HashMap<>();
        for (ReliefRecord record : visibleRecords) {
            database.put(record.getSerialId(), responseFor(record));
        }
        return ResponseEntity.ok(database);
    }

    @PostMapping("/database")
    public ResponseEntity<Map<String, Object>> saveRecord(@RequestBody Map<String, Object> body) {
        String serialId = text(body, "serialId");
        Object dataValue = body.get("data");
        if (serialId == null || serialId.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Missing serialId");
        }
        if (!(dataValue instanceof Map<?, ?> rawData)) {
            return error(HttpStatus.BAD_REQUEST, "Missing data");
        }

        Map<String, Object> data = new HashMap<>();
        rawData.forEach((key, value) -> data.put(String.valueOf(key), value));

        String userEmail = text(data, "userEmail");
        if (userEmail == null || userEmail.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Missing userEmail");
        }

        ReliefRecord record = records.findById(serialId).orElseGet(ReliefRecord::new);
        record.setSerialId(serialId);
        record.setType(text(data, "type"));
        record.setName(text(data, "name"));
        record.setItem(text(data, "item"));
        record.setQuantity(text(data, "quantity"));
        record.setStatus(text(data, "status"));
        record.setUserEmail(userEmail);
        record.setItemImage(text(data, "itemImage"));

        try {
            record.setOtherInfo(objectMapper.writeValueAsString(data));
        } catch (Exception ex) {
            return error(HttpStatus.BAD_REQUEST, "Could not serialize record data");
        }

        records.save(record);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Record saved");
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> responseFor(ReliefRecord record) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", record.getType());
        response.put("name", record.getName());
        response.put("item", record.getItem());
        response.put("quantity", record.getQuantity());
        response.put("status", record.getStatus());
        response.put("userEmail", record.getUserEmail());
        response.put("itemImage", record.getItemImage());

        if (record.getOtherInfo() != null && !record.getOtherInfo().isBlank()) {
            try {
                response.putAll(objectMapper.readValue(
                        record.getOtherInfo(),
                        new TypeReference<Map<String, Object>>() {
                        }));
            } catch (Exception ignored) {
                // Keep the typed columns if an older row contains malformed JSON.
            }
        }

        return response;
    }

    private boolean isAdmin(String userEmail) {
        return "admin@gmail.com".equalsIgnoreCase(userEmail) || "admin".equalsIgnoreCase(userEmail);
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
