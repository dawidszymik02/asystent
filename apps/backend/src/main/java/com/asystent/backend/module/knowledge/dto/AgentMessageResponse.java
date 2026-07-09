package com.asystent.backend.module.knowledge.dto;

import java.util.List;
import java.util.UUID;

public record AgentMessageResponse(
        String response,
        UUID conversationId,
        List<String> sourcesUsed
) {
}
