package com.asystent.backend.module.knowledge.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record CreateDocumentRequest(
        @NotBlank String title,
        String type,
        @NotBlank String contentRaw,
        List<UUID> tagIds
) {}
