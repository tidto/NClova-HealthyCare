# Voice EMR MVP

AI 기반 스마트 문진 및 EMR 대시보드 MVP입니다.

## 1) 구성
- `frontend`: React + Tailwind 기반 환자 문진/의료진 대시보드 UI
- `backend`: Spring Boot + JPA + Flyway 기반 문진 저장/조회 API
- `docker-compose.yml`: PostgreSQL 로컬 실행

## 2) 핵심 API
- `POST /api/intake`
  - 요청: `patientName`, `birthDate`, `transcript`
  - 동작: AI(CC/D/PL/Keywords) 추출 후 `patients`, `emr_records` 저장
- `GET /api/emr/{recordId}`: EMR 단건 조회
- `GET /api/patients/{patientId}/records`: 환자별 EMR 목록 조회

## 3) 실행
### PostgreSQL
```bash
docker compose up -d
```

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4) 환경변수
`.env.example` 값을 참고해 설정하세요.

- `AI_PROVIDER=rule-based`: 키 없이 동작하는 규칙 기반 추출
- `AI_PROVIDER=gemini`: Gemini API 연동

Gemini 모드 예시:
```bash
export AI_PROVIDER=gemini
export GEMINI_API_KEY=your_key
```

## 5) AI 추출 포맷
```json
{
  "cc": "귀 가려움",
  "duration": "2~3일 전",
  "presentIllness": "귀 안쪽이 가려운 증상으로 내원...",
  "keywords": {
    "Ear itching": "+",
    "Ear discomfort": "+",
    "Cold symptoms": "-"
  }
}
```

## 6) 테이블
- `patients(patient_id, name, birth_date)`
- `emr_records(record_id, patient_id, cc_symptom, duration, present_illness, symptom_keywords, raw_transcript, created_at)`

`emr_records.symptom_keywords`는 `JSONB`로 저장됩니다.

## 7) 무료 모델 추천(2026-05-18 기준 확인)
1. **Gemini Developer API (Free Tier)**
   - 장점: JSON 응답 강제(`responseMimeType=application/json`)가 쉬워 의료 구조화 파이프라인에 적합
   - 참고: billing/pricing 문서에서 free tier 제공 명시
2. **Hugging Face Inference Providers (Free credits)**
   - 장점: 공급자/모델 교체가 빠르고 프로토타입 비용이 낮음
   - 참고: 매월 소액 무료 크레딧 제공(변동 가능)

운영 안정성과 품질 기준으로는 **Gemini free tier로 시작 -> 트래픽 증가 시 유료/하이브리드 전환**을 권장합니다.

## 8) 다음 확장
- 환자 재내원 시 기존 환자 조회/업데이트 플로우
- 문진 단계별 질문 생성(증상 분류 기반)
- 의사용 필터링(불필요 대화 제거) 및 실시간 스트리밍 대시보드
