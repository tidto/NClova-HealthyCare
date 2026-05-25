package com.voiceemr.ai;

import com.voiceemr.dto.EmrExtractedData;

public interface EmrExtractionClient {
    EmrExtractedData extract(String transcript);
}
