package com.voiceemr.ai;

import com.voiceemr.dto.EmrExtractedData;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class RuleBasedEmrExtractionClient implements EmrExtractionClient {
    @Override
    public EmrExtractedData extract(String transcript) {
        String cc = transcript.contains("귀") ? "귀 가려움" : "일반 증상";
        String duration = transcript.contains("2") || transcript.contains("이틀") ? "2~3일 전" : "확인 필요";

        Map<String, String> keywords = new LinkedHashMap<>();
        keywords.put("Ear itching", transcript.contains("가려") ? "+" : "-");
        keywords.put("Ear discomfort", transcript.contains("불편") || transcript.contains("통증") ? "+" : "-");
        keywords.put("Cold symptoms", transcript.contains("감기") && !transcript.contains("아니") ? "+" : "-");

        String presentIllness = transcript.length() > 350
                ? transcript.substring(0, 350)
                : transcript;

        return new EmrExtractedData(cc, duration, presentIllness, keywords);
    }
}
