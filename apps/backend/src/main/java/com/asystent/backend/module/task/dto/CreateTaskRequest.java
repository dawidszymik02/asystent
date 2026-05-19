package com.asystent.backend.module.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateTaskRequest(
        @NotBlank String title,
        @NotNull LocalDate date,
        Integer position
) {}
