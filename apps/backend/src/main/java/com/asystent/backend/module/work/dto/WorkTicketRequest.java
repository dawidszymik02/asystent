package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record WorkTicketRequest(
        @NotBlank String title,
        String description,
        String clientName,
        UUID programId,
        String status,
        String priority,
        String sourceRef
) {}
