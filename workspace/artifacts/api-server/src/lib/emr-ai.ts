import { logger } from "./logger";

export type EmrDraft = {
  cc: string;
  duration: string;
  presentIllness: string;
  keywords: Record<string, string>;
};

const DEFAULT_MODEL = "deepseek-ai/deepseek-v4-pro-0813";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

const clinicalKeywords = [
  "Ear itching",
  "Ear discharge",
  "Ear pain",
  "Cold symptoms",
  "Fever",
];

function ruleBasedDraft(transcript: string): EmrDraft {
  const patientTranscript =
    transcript
      .split(/\r?\n/)
      .filter((line) => /^(환자|patient)\s*:/i.test(line.trim()))
      .join(" ") || transcript;
  const has = (...terms: string[]) =>
    terms.some((term) => patientTranscript.includes(term));
  const negated = (term: string) =>
    patientTranscript.includes(`${term}는 아니`) ||
    patientTranscript.includes(`${term}은 아니`) ||
    patientTranscript.includes(`${term}는 없`) ||
    patientTranscript.includes(`${term}은 없`) ||
    patientTranscript.includes(`없${term}`);

  const keywords: Record<string, string> = {};
  for (const keyword of clinicalKeywords) {
    const matches =
      keyword === "Ear itching"
        ? has("가려", "간지")
        : keyword === "Ear discharge"
          ? has("분비물", "물") && has("귀")
          : keyword === "Ear pain"
            ? has("귀 아", "귀가 아", "통증")
            : keyword === "Cold symptoms"
              ? has("감기", "콧물", "기침")
              : has("열", "발열", "체온");
    keywords[keyword] = matches && !negated(keyword === "Cold symptoms" ? "감기" : keyword) ? "+" : "-";
  }

  const cc = has("귀") ? "귀 증상" : has("목", "코") ? "상기도 증상" : "일반 증상";
  const duration = has("오늘", "금일")
    ? "오늘부터"
    : has("이틀", "2일", "2~3일")
      ? "2~3일 전부터"
      : has("일주일", "7일")
        ? "1주일 전부터"
        : "확인 필요";

  return {
    cc,
    duration,
    presentIllness:
      transcript.length > 500 ? `${transcript.slice(0, 500)}…` : transcript,
    keywords,
  };
}

function readDraft(content: unknown): EmrDraft {
  const value =
    typeof content === "string" ? JSON.parse(content) : (content ?? {});
  if (!value || typeof value !== "object") {
    throw new Error("NVIDIA response was not an object");
  }

  const record = value as Record<string, unknown>;
  const keywordValue = record.keywords;
  const keywords =
    keywordValue && typeof keywordValue === "object"
      ? Object.fromEntries(
          Object.entries(keywordValue as Record<string, unknown>).map(
            ([key, item]) => [key, typeof item === "string" ? item : "-"],
          ),
        )
      : {};

  return {
    cc: typeof record.cc === "string" ? record.cc : "확인 필요",
    duration:
      typeof record.duration === "string" ? record.duration : "확인 필요",
    presentIllness:
      typeof record.presentIllness === "string"
        ? record.presentIllness
        : "확인 필요",
    keywords,
  };
}

async function nvidiaDraft(transcript: string): Promise<EmrDraft> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  const baseUrl = process.env.NVIDIA_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.NVIDIA_MODEL ?? DEFAULT_MODEL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 1,
      top_p: 0.9,
      max_tokens: 16384,
      seed: 42,
      chat_template_kwargs: { thinking: false },
      messages: [
        {
          role: "system",
          content:
            "당신은 의료진의 기록 작성을 돕는 문진 정리 도구입니다. 진단, 처방, 위험도 판단을 하지 말고 대화에 있는 사실만 구조화합니다. JSON만 출력하세요.",
        },
        {
          role: "user",
          content: `다음 대화에서 CC(주호소), duration(기간), presentIllness(현병력 요약), keywords(증상 여부)를 추출하세요. keywords 값은 + 또는 -만 사용하고, 관찰되지 않은 항목은 -로 표시하세요. JSON 형식은 {"cc":"...", "duration":"...", "presentIllness":"...", "keywords":{"Ear itching":"+","Ear discharge":"-","Ear pain":"-","Cold symptoms":"-","Fever":"-"}} 입니다.\n\n대화:\n${transcript}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  return readDraft(content);
}

export async function extractEmrDraft(transcript: string): Promise<EmrDraft> {
  const provider = process.env.AI_PROVIDER ?? "nvidia";
  if (provider !== "nvidia") {
    return ruleBasedDraft(transcript);
  }

  try {
    return await nvidiaDraft(transcript);
  } catch (error) {
    logger.warn(
      { err: error },
      "NVIDIA extraction unavailable; using rule-based fallback",
    );
    return ruleBasedDraft(transcript);
  }
}

export function getAiConfig() {
  const provider = process.env.AI_PROVIDER ?? "nvidia";
  const nvidiaConfigured = Boolean(process.env.NVIDIA_API_KEY);
  return {
    model: process.env.NVIDIA_MODEL ?? DEFAULT_MODEL,
    provider:
      provider === "nvidia" && nvidiaConfigured
        ? "NVIDIA NIM"
        : "Rule-based fallback",
    fallbackEnabled: true,
  };
}