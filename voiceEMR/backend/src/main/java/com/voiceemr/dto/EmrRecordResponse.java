package com.voiceemr.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public record EmrRecordResponse(
        Integer recordId,
        Integer patientId,
        String patientName,
        LocalDate birthDate,
        String cc,
        String duration,
        String presentIllness,
        Map<String, String> keywords,
        LocalDateTime createdAt
) {
}
