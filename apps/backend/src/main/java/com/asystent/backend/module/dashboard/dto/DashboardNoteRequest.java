package com.asystent.backend.module.dashboard.dto;

import jakarta.validation.constraints.NotNull;

public record DashboardNoteRequest(
        @NotNull String content
) {}
