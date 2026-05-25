package com.voiceemr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "emr_records")
public class EmrRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Integer recordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "cc_symptom", nullable = false, length = 255)
    private String ccSymptom;

    @Column(name = "duration", nullable = false, length = 100)
    private String duration;

    @Column(name = "present_illness", nullable = false, columnDefinition = "TEXT")
    private String presentIllness;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "symptom_keywords", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> symptomKeywords = new LinkedHashMap<>();

    @Column(name = "raw_transcript", nullable = false, columnDefinition = "TEXT")
    private String rawTranscript;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Integer getRecordId() {
        return recordId;
    }

    public void setRecordId(Integer recordId) {
        this.recordId = recordId;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public String getCcSymptom() {
        return ccSymptom;
    }

    public void setCcSymptom(String ccSymptom) {
        this.ccSymptom = ccSymptom;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getPresentIllness() {
        return presentIllness;
    }

    public void setPresentIllness(String presentIllness) {
        this.presentIllness = presentIllness;
    }

    public Map<String, String> getSymptomKeywords() {
        return symptomKeywords;
    }

    public void setSymptomKeywords(Map<String, String> symptomKeywords) {
        this.symptomKeywords = symptomKeywords;
    }

    public String getRawTranscript() {
        return rawTranscript;
    }

    public void setRawTranscript(String rawTranscript) {
        this.rawTranscript = rawTranscript;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
