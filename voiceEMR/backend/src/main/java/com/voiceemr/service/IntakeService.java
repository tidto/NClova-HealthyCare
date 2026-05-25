package com.voiceemr.service;

import com.voiceemr.ai.EmrExtractionClient;
import com.voiceemr.dto.CreateIntakeRequest;
import com.voiceemr.dto.CreateIntakeResponse;
import com.voiceemr.dto.EmrExtractedData;
import com.voiceemr.dto.EmrRecordResponse;
import com.voiceemr.entity.EmrRecord;
import com.voiceemr.entity.Patient;
import com.voiceemr.repository.EmrRecordRepository;
import com.voiceemr.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IntakeService {
    private final EmrExtractionClient extractionClient;
    private final PatientRepository patientRepository;
    private final EmrRecordRepository emrRecordRepository;

    public IntakeService(
            EmrExtractionClient extractionClient,
            PatientRepository patientRepository,
            EmrRecordRepository emrRecordRepository
    ) {
        this.extractionClient = extractionClient;
        this.patientRepository = patientRepository;
        this.emrRecordRepository = emrRecordRepository;
    }

    @Transactional
    public CreateIntakeResponse createIntake(CreateIntakeRequest request) {
        Patient patient = new Patient();
        patient.setName(request.patientName().trim());
        patient.setBirthDate(request.birthDate());
        Patient savedPatient = patientRepository.save(patient);

        EmrExtractedData extracted = extractionClient.extract(request.transcript());

        EmrRecord record = new EmrRecord();
        record.setPatient(savedPatient);
        record.setCcSymptom(extracted.cc());
        record.setDuration(extracted.duration());
        record.setPresentIllness(extracted.presentIllness());
        record.setSymptomKeywords(extracted.keywords());
        record.setRawTranscript(request.transcript());
        record.setCreatedAt(LocalDateTime.now());

        EmrRecord savedRecord = emrRecordRepository.save(record);

        return new CreateIntakeResponse(savedPatient.getPatientId(), savedRecord.getRecordId(), toResponse(savedRecord));
    }

    @Transactional(readOnly = true)
    public EmrRecordResponse getRecord(Integer recordId) {
        EmrRecord record = emrRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found: " + recordId));
        return toResponse(record);
    }

    @Transactional(readOnly = true)
    public List<EmrRecordResponse> getPatientRecords(Integer patientId) {
        return emrRecordRepository.findByPatient_PatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private EmrRecordResponse toResponse(EmrRecord record) {
        return new EmrRecordResponse(
                record.getRecordId(),
                record.getPatient().getPatientId(),
                record.getPatient().getName(),
                record.getPatient().getBirthDate(),
                record.getCcSymptom(),
                record.getDuration(),
                record.getPresentIllness(),
                record.getSymptomKeywords(),
                record.getCreatedAt()
        );
    }
}
