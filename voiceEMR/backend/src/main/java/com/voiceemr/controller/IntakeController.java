package com.voiceemr.controller;

import com.voiceemr.dto.CreateIntakeRequest;
import com.voiceemr.dto.CreateIntakeResponse;
import com.voiceemr.dto.EmrRecordResponse;
import com.voiceemr.service.IntakeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class IntakeController {
    private final IntakeService intakeService;

    public IntakeController(IntakeService intakeService) {
        this.intakeService = intakeService;
    }

    @PostMapping("/intake")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateIntakeResponse createIntake(@Valid @RequestBody CreateIntakeRequest request) {
        return intakeService.createIntake(request);
    }

    @GetMapping("/emr/{recordId}")
    public EmrRecordResponse getRecord(@PathVariable Integer recordId) {
        return intakeService.getRecord(recordId);
    }

    @GetMapping("/patients/{patientId}/records")
    public List<EmrRecordResponse> getPatientRecords(@PathVariable Integer patientId) {
        return intakeService.getPatientRecords(patientId);
    }
}
