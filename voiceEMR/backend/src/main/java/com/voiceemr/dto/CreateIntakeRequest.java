package com.voiceemr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateIntakeRequest(
        @NotBlank String patientName,
        @NotNull LocalDate birthDate,
        @NotBlank String transcript
) {
}
