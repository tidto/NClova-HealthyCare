CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS emr_records (
    record_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    cc_symptom VARCHAR(255) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    present_illness TEXT NOT NULL,
    symptom_keywords JSONB NOT NULL,
    raw_transcript TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emr_patient_id ON emr_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_created_at ON emr_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emr_keywords_gin ON emr_records USING GIN (symptom_keywords);
