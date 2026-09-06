# HealthyCare Voice EMR

의료진이 환자 문진 대화를 입력하면, 대화 원문을 보존한 채 주호소(CC), 증상 기간(D), 현병력(PL), 증상 키워드를 정리해 주는 문진 기록 보조 MVP입니다.

이 프로젝트는 [`tidto/NClova-HealthyCare`](https://github.com/tidto/NClova-HealthyCare)의 초안을 기준으로 실행 흐름과 제품 범위를 다시 정리한 것입니다. 목표는 진단을 자동화하는 것이 아니라, 의료진이 차트에 옮겨 적는 시간을 줄이고 AI가 만든 초안을 검토하기 쉽게 만드는 것입니다.

## 현재 제공하는 기능

- 환자 이름, 생년월일, 문진 대화 원문 입력
- 대화 원문을 기반으로 한 CC / 증상 기간 / 현병력 요약 / 증상 키워드 추출
- 추출 결과를 PostgreSQL에 환자·방문 기록으로 저장
- 최근 저장 기록 목록과 기록 상세 확인
- 총 기록 수, 오늘 기록 수, 현재 AI 제공자 상태 표시
- NVIDIA DeepSeek API 연동과 키가 없는 환경에서의 규칙 기반 fallback
- 모든 결과가 “의료진 검토가 필요한 초안”임을 UI와 문서에서 명시

## 실행

이 저장소는 Replit workspace의 pnpm monorepo로 구성되어 있습니다.

### 필요한 환경

- Node.js 24
- pnpm
- Replit에서 제공하는 `DATABASE_URL`
- 선택 사항: `NVIDIA_API_KEY` Secret

### 로컬/개발 실행

터미널을 두 개 열고 각각 실행합니다.

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/voice-emr run dev
```

또는 Replit의 다음 workflow를 사용합니다.

- `artifacts/api-server: API Server`
- `artifacts/voice-emr: web`

데이터베이스 스키마를 처음 적용하거나 변경한 뒤에는 다음을 실행합니다.

```bash
pnpm --filter @workspace/db run push
```

전체 타입 검사:

```bash
pnpm run typecheck
```

API 계약을 변경한 경우:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## AI 설정

NVIDIA NIM의 OpenAI 호환 Chat Completions API를 사용해 문진 정리를 요청합니다.

```bash
AI_PROVIDER=nvidia
NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro-0813
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

`NVIDIA_API_KEY`는 코드나 `.env` 파일에 넣지 말고 Replit Secret으로 등록합니다. 키가 없거나 NVIDIA 요청이 실패하면 현재 MVP는 규칙 기반 추출로 fallback하여 데모가 멈추지 않게 합니다. 상태 요약에는 실제로 사용할 수 있는 provider가 표시됩니다.

## API 흐름

1. 브라우저가 `POST /api/emr/intake`로 환자 정보와 대화 원문을 전송합니다.
2. 서버가 NVIDIA `deepseek-ai/deepseek-v4-pro-0813`에 문진 정리를 요청합니다.
3. 응답이 없거나 키가 없으면 규칙 기반 fallback이 같은 출력 구조를 만듭니다.
4. 서버가 환자와 EMR 기록을 PostgreSQL에 저장합니다.
5. 구조화된 기록을 브라우저에 반환하여 의료진 검토 화면에 표시합니다.
6. `GET /api/emr/records`와 `GET /api/emr/records/{recordId}`로 저장 기록을 다시 확인합니다.

## 제품 범위

기사에서 소개된 CLOVA Voice EMR의 방향성 중 이번 MVP에 남긴 것은 **대화 내용을 의료 기록 초안으로 구조화하여 의료진의 기록 부담을 줄이는 것**입니다.

이번에 만들지 않는 기능은 음성 녹음·실시간 음성인식, 발음 오류에 강한 별도 경량 음성 모델, 병동 간호 에이전트와 도구 호출, 병원 EMR 연동, 자동 진단·처방·위험도 판단입니다. 이유와 후속 기준은 [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)에 적었습니다.

## 안전 범위

- 이 앱은 의료진을 위한 기록 작성 보조 도구입니다.
- AI 출력은 진단, 처방, 응급도 판단이 아닌 문진 내용의 정리 초안입니다.
- 환자 정보와 원문 대화는 개발 데이터베이스에 저장되므로 실제 운영 전 접근 제어, 감사 로그, 보존 기간, 암호화, 개인정보 보호 검토가 필요합니다.
- NVIDIA 모델의 function calling 능력은 사용하지 않습니다. 이번 범위에서는 단일 텍스트 입력과 구조화된 JSON 응답만 사용합니다.

## 문서

- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — 원본 프로젝트 파악, 실행 순서, 구현/보류 범위, AI 모델과 결정 사항