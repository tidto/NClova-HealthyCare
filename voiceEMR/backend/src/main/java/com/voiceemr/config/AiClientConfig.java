package com.voiceemr.config;

import com.voiceemr.ai.EmrExtractionClient;
import com.voiceemr.ai.GeminiEmrExtractionClient;
import com.voiceemr.ai.RuleBasedEmrExtractionClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiClientConfig {
    @Bean
    public EmrExtractionClient emrExtractionClient(
            @Value("${app.ai.provider}") String provider,
            GeminiEmrExtractionClient gemini,
            RuleBasedEmrExtractionClient ruleBased
    ) {
        return "gemini".equalsIgnoreCase(provider) ? gemini : ruleBased;
    }
}
