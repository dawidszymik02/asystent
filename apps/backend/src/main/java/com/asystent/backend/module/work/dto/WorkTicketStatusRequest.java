package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkTicketStatusRequest(
        @NotBlank String key,
        @NotBlank String label,
        String color,
        String bgColor,
        Integer sortOrder,
        Boolean isActive
) {}
