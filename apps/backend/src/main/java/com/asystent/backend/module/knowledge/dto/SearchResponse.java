package com.asystent.backend.module.knowledge.dto;

import java.util.List;

public record SearchResponse(
        String query,
        List<SearchResultItem> results
) {}
