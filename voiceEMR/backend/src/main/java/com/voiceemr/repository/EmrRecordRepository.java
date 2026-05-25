package com.voiceemr.repository;

import com.voiceemr.entity.EmrRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmrRecordRepository extends JpaRepository<EmrRecord, Integer> {
    List<EmrRecord> findByPatient_PatientIdOrderByCreatedAtDesc(Integer patientId);
}
