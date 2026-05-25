package com.voiceemr.dto;

import java.util.Map;

public record EmrExtractedData(
        String cc,
        String duration,
        String presentIllness,
        Map<String, String> keywords
) {
}
