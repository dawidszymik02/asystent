package com.asystent.backend.module.knowledge.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String title,
        String type,
        int chunkCount,
        OffsetDateTime createdAt,
        List<TagResponse> tags
) {}
