# HealthyCare Voice EMR 프로젝트 파악 문서

## 1. 한 줄 요약

환자와 의료진의 문진 대화 원문을 입력받아 의료진이 검토할 수 있는 EMR 초안(CC, 증상 기간, 현병력, 증상 키워드)으로 정리하고 저장하는 기록 보조 MVP입니다.

이 서비스는 진료를 대신하는 AI가 아니라, 의료진이 진료 중 컴퓨터에 반복적으로 입력하는 기록 작업을 줄이는 도구입니다.

## 2. 참고한 원본과 방향

### 원본 저장소

- 저장소: [`tidto/NClova-HealthyCare`](https://github.com/tidto/NClova-HealthyCare)
- 원본의 제품명: Voice EMR MVP
- 원본 구조:
  - `frontend`: React + Vite + Tailwind 기반 문진/EMR 화면
  - `backend`: Spring Boot 3.3 + JPA + Flyway 기반 API
  - `docker-compose.yml`: PostgreSQL 로컬 실행
  - AI 선택지: 규칙 기반 추출 또는 Gemini 호출

원본 코드는 화면과 API의 핵심 골격은 있지만, 실제 음성 입력이나 실시간 처리, 에이전트 도구 호출까지 구현한 상태는 아니었습니다. 따라서 이번 작업에서는 원본이 의도한 흐름을 유지하면서, 현재 workspace에서 바로 실행하고 확인할 수 있는 작은 범위로 다시 구성했습니다.

### CLOVA Healthcare AI 기사에서 가져온 핵심

기사의 핵심 문제는 의료진이 환자와 대화하면서 동시에 의무 기록을 작성해야 하는 부담입니다. 기사에서 설명하는 Voice EMR은 대화 내용을 실시간으로 분석하고, 진료가 끝난 뒤 정리된 의무 기록을 제공하는 방향입니다.

기사에는 두 가지 중요한 설계 힌트가 있습니다.

1. 음성인식 결과 전체를 큰 언어 모델에 보내지 않고, 필요한 의료 정보만 걸러 비용과 정확도를 관리합니다.
2. 병동 에이전트는 사용자의 요청을 해석한 뒤 적절한 모델이나 도구를 호출하는 다단계 시스템입니다.

현재 MVP는 첫 번째 문제의 최종 사용자 가치인 **문진 대화를 기록 초안으로 정리하는 경험**만 구현합니다. 음성 앞단의 특화 모델과 병동 에이전트는 데이터·업무 규칙·안전 검토가 필요한 별도 단계로 남겼습니다.

## 3. 현재 구현한 것

### 사용자 흐름

1. 의료진이 환자 이름과 생년월일을 입력합니다.
2. 진료 대화 또는 문진 대화 원문을 붙여 넣습니다.
3. `문진 초안 만들기`를 실행합니다.
4. 서버가 AI 또는 fallback extractor로 다음 값을 만듭니다.
   - `CC`: 주호소
   - `duration`: 증상 기간
   - `presentIllness`: 현병력 요약
   - `keywords`: 증상 여부를 `+` / `-`로 표시
5. 원문과 구조화 결과를 함께 저장합니다.
6. 의료진은 구조화 결과와 원문을 나란히 보고 수정·검토할 수 있습니다.
7. 최근 기록 화면에서 이전 초안을 다시 열어볼 수 있습니다.

### API

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| `GET` | `/api/healthz` | 서버 상태 확인 |
| `GET` | `/api/emr/summary` | 기록 수와 현재 AI 설정 확인 |
| `GET` | `/api/emr/records?limit=10` | 최근 기록 목록 |
| `POST` | `/api/emr/intake` | 문진 원문을 추출하고 환자·EMR 저장 |
| `GET` | `/api/emr/records/{recordId}` | 기록 하나의 상세 조회 |

API 계약의 원본은 `lib/api-spec/openapi.yaml`이며, 프론트엔드 hooks와 서버 검증 스키마는 이 파일에서 codegen합니다.

### 저장 구조

- `patients`
  - `patient_id`
  - `name`
  - `birth_date`
- `emr_records`
  - `record_id`
  - `patient_id`
  - `cc_symptom`
  - `duration`
  - `present_illness`
  - `symptom_keywords` (`jsonb`)
  - `raw_transcript`
  - `created_at`

현재는 동일인의 재방문을 자동으로 합치는 기능 없이 intake 요청마다 환자와 방문 기록을 새로 만듭니다. 이는 개인정보 식별 정책을 임의로 결정하지 않기 위한 의도적인 MVP 제한입니다.

## 4. 실행과 데이터 흐름

### 실행 순서

1. API 서버가 `/api` 아래 Express route를 제공합니다.
2. 프론트엔드 Vite 앱이 `/`에서 실행됩니다.
3. 프론트엔드는 `@workspace/api-client-react`에서 생성된 React Query hooks를 사용합니다.
4. API 서버는 `@workspace/api-zod`로 요청·응답을 검증합니다.
5. DB는 `@workspace/db`의 Drizzle schema를 통해 PostgreSQL에 접근합니다.

### 문진 저장 상세 순서

```text
사용자 입력
  -> POST /api/emr/intake
  -> CreateEmrIntakeBody 검증
  -> NVIDIA NIM DeepSeek 호출
       또는 키 없음/호출 실패 시 rule-based fallback
  -> patients INSERT
  -> emr_records INSERT
  -> EmrRecord 응답 검증
  -> 프론트엔드 결과/최근 기록 캐시 갱신
```

서버는 AI 응답을 그대로 믿고 저장하지 않습니다. 필요한 문자열과 키워드 형태를 정리한 뒤, API 응답 schema에 맞는 값만 화면으로 보냅니다. 그래도 AI 결과는 의료진의 검토가 필요한 초안입니다.

## 5. 사용 AI 모델

### NVIDIA NIM

- 제공자: NVIDIA Build / NVIDIA API
- 모델: `deepseek-ai/deepseek-v4-pro-0813`
- API 방식: OpenAI 호환 Chat Completions
- 기본 endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- 기본 설정:
  - `temperature: 1`
  - `top_p: 0.95`
  - `max_tokens: 16384`
  - `seed: 42`
  - `chat_template_kwargs.thinking: false`
  - 텍스트 입력, JSON 형태 응답 요청

이 모델은 NVIDIA 페이지에서 텍스트 생성·추론·코딩·agentic tool-use 용도로 소개되어 있지만, 이 프로젝트에서는 그 능력을 넓게 사용하지 않습니다. 한 번의 텍스트 입력에서 문진 항목을 구조화하는 역할만 맡깁니다. function calling, 외부 도구 검색, 장기 대화 메모리는 사용하지 않습니다.

### 키가 없을 때

`NVIDIA_API_KEY`가 없거나 요청이 실패하면 동일한 출력 계약을 가진 규칙 기반 fallback이 작동합니다. 이 fallback은 귀 가려움, 분비물, 통증, 감기, 발열 등 데모에 필요한 단순 키워드를 찾는 수준입니다. 임상 정확도를 보장하는 모델이 아니며, NVIDIA 연결 상태를 확인하기 위한 개발용 안전장치입니다.

키 설정:

```text
NVIDIA_API_KEY=<Replit Secret>
NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro-0813
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
AI_PROVIDER=nvidia
```

키를 코드, README, commit, `.env`에 직접 기록하면 안 됩니다.

## 6. 이번에 만든 것과 뺀 것

### 만든 것

- 문진 원문 입력 화면
- 환자 기본 정보 입력
- 구조화 결과 검토 화면
- 원문과 결과를 함께 저장하는 API
- 최근 기록 목록과 상세 조회
- 대시보드 요약 정보
- NVIDIA 모델 연동 지점과 모델 식별 문서
- NVIDIA 키가 없는 개발 환경용 fallback
- OpenAPI → generated hooks/schema 기반의 공통 계약
- 의료진 검토가 필요한 초안이라는 안전 경계

### 뺀 것 또는 보류한 것

| 기능 | 상태 | 보류 이유 |
| --- | --- | --- |
| 마이크 녹음과 실시간 음성인식 | 보류 | 브라우저 음성 입력, STT provider, 스트리밍 오류 처리까지 결정되지 않음 |
| 발음 오류·소음에 강한 경량 모델 | 보류 | 기사에 나온 별도 연구 영역이며 학습 데이터·평가셋·모델 배포가 없음 |
| 대화 중 실시간 필터링 | 보류 | 위 경량 모델과 스트리밍 파이프라인이 먼저 필요함 |
| 병동 간호 에이전트 | 보류 | 호출할 실제 병원 업무 도구와 권한 모델이 정의되지 않음 |
| function calling / 외부 도구 호출 | 보류 | 현재 사용자는 문진 원문 하나를 정리하면 되며 도구 호출이 과함 |
| 자동 진단·처방·복약 추천 | 제외 | 의료 안전상 기록 보조 범위를 넘으며 검증 책임이 큼 |
| 병원 EMR/HIS 연동 | 보류 | 기관별 인증·표준·개인정보 계약이 필요함 |
| 환자 로그인·의료진 권한 관리 | 보류 | 운영 사용자와 기관 권한 정책이 정해지지 않음 |
| 감사 로그·보존 기간·암호화 정책 | 운영 전 필수 | 실제 환자정보를 다루기 전 별도 보안 설계가 필요함 |
| 기존 Gemini provider | 교체 | 요청한 NVIDIA 모델을 기준으로 문서와 실행 설정을 통일함 |
| 동일 환자 자동 병합 | 보류 | 주민번호 등 민감 식별정보를 임의로 도입하지 않기 위함 |

## 7. 애매해서 미룬 결정

- 음성 파일을 저장할지, 실시간 스트림만 처리할지 결정하지 않았습니다.
- EMR 출력 항목을 CC/D/PL/Keywords 외에 어떻게 확장할지 결정하지 않았습니다.
- 의료진이 AI 결과를 수정하고 확정하는 저장 상태를 아직 만들지 않았습니다.
- 실제 운영에서 사용할 모델 temperature, 토큰 제한, 개인정보 마스킹 정책은 평가 데이터 없이는 확정하지 않았습니다.
- 의료진 인증, 환자 검색, 기관별 테넌트 분리, 한국 의료 데이터 보존 정책은 제품 요구사항이 정해진 뒤 진행해야 합니다.

## 8. 다음 진행 순서

1. 실제 문진 예시를 모아 추출 항목과 실패 사례를 정합니다.
2. AI 출력 평가 기준을 만들고 NVIDIA 모델과 fallback 결과를 비교합니다.
3. 의료진이 결과를 수정·확정하는 상태를 추가합니다.
4. 필요할 때만 음성인식과 실시간 처리를 도입합니다.
5. 기관 연동과 인증이 확정되면 보안·감사·보존 정책을 먼저 설계합니다.

현재 상태에서 가장 중요한 것은 기능을 크게 늘리는 것이 아니라, 원문과 AI 초안의 관계를 의료진이 신뢰할 수 있는지 확인하는 것입니다.