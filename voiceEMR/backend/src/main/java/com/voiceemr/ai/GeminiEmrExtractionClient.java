package com.voiceemr.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceemr.dto.EmrExtractedData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiEmrExtractionClient implements EmrExtractionClient {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String model;
    private final String apiKey;

    public GeminiEmrExtractionClient(
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini.base-url}") String baseUrl,
            @Value("${app.ai.gemini.model}") String model,
            @Value("${app.ai.gemini.api-key}") String apiKey
    ) {
        this.restTemplate = restTemplateBuilder.build();
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.model = model;
        this.apiKey = apiKey;
    }

    @Override
    public EmrExtractedData extract(String transcript) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured");
        }

        String prompt = """
                당신은 의료 문진 데이터 정형화 시스템입니다.
                다음 대화에서 CC, D, PL, Keywords를 JSON으로만 출력하세요.
                형식:
                {
                  \"cc\": \"...\",
                  \"duration\": \"...\",
                  \"presentIllness\": \"...\",
                  \"keywords\": {\"Ear itching\": \"+\", \"Ear discomfort\": \"-\"}
                }
                대화:
                %s
                """.formatted(transcript);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String endpoint = "%s/v1beta/models/%s:generateContent?key=%s".formatted(baseUrl, model, apiKey);
        String response = restTemplate.postForObject(endpoint, new HttpEntity<>(body, headers), String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("{}");
            JsonNode emr = objectMapper.readTree(text);

            Map<String, String> keywords = new LinkedHashMap<>();
            JsonNode keywordNode = emr.path("keywords");
            keywordNode.fields().forEachRemaining(e -> keywords.put(e.getKey(), e.getValue().asText("-")));

            return new EmrExtractedData(
                    emr.path("cc").asText("확인 필요"),
                    emr.path("duration").asText("확인 필요"),
                    emr.path("presentIllness").asText("확인 필요"),
                    keywords
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse Gemini response", ex);
        }
    }
}
