package com.asystent.backend.module.knowledge.dto;

import java.util.List;
import java.util.UUID;

public record SearchResultItem(
        UUID chunkId,
        UUID documentId,
        String documentTitle,
        String content,
        List<TagResponse> tags,
        double similarity
) {}
