package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkClientRequest(
        @NotBlank String name
) {}
