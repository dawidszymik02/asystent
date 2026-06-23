package com.asystent.backend.module.knowledge.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TagResponse(
        UUID id,
        String name,
        OffsetDateTime createdAt
) {}
