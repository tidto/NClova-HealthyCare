INSERT INTO patients(name, birth_date)
VALUES ('샘플환자', '1991-06-20')
ON CONFLICT DO NOTHING;

INSERT INTO emr_records(patient_id, cc_symptom, duration, present_illness, symptom_keywords, raw_transcript, created_at)
SELECT p.patient_id,
       '귀 가려움',
       '2~3일 전',
       '귀 안쪽 가려움으로 내원. 이틀 전부터 오른쪽 귀에서 분비물이 있고, 감기 증상은 없음.',
       '{"Ear itching":"+","Ear discomfort":"+","Cold symptoms":"-"}'::jsonb,
       '환자: 귀 안쪽이 가려워요. 환자: 이틀 전부터 오른쪽 귀에서 물이 나오고 가려워요. 환자: 감기는 아니에요.',
       CURRENT_TIMESTAMP
FROM patients p
WHERE p.name = '샘플환자'
  AND NOT EXISTS (
      SELECT 1 FROM emr_records e WHERE e.patient_id = p.patient_id
  );
