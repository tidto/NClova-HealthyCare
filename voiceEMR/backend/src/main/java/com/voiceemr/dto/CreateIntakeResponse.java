package com.voiceemr.dto;

public record CreateIntakeResponse(
        Integer patientId,
        Integer recordId,
        EmrRecordResponse emr
) {
}
