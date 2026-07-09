package com.asystent.backend.module.knowledge.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record AgentMessageRequest(
        @NotBlank String message,
        UUID conversationId
) {
}
