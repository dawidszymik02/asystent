package com.asystent.backend.module.knowledge.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AgentConversationResponse(
        UUID id,
        String title,
        OffsetDateTime createdAt
) {
}
