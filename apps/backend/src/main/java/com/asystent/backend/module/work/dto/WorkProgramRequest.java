package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkProgramRequest(
        @NotBlank String name,
        String shortCode,
        String color,
        String description,
        Boolean isActive
) {}
