package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkTaskNoteRequest(
        @NotBlank String content
) {}
