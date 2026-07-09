package com.asystent.backend.module.knowledge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record SearchRequest(
        @NotBlank String query,
        List<UUID> tagIds,
        @Min(1) @Max(20) Integer limit
) {
    public SearchRequest {
        if (limit == null) limit = 8;
    }
}
