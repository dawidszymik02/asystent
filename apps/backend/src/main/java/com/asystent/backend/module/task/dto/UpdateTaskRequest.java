package com.asystent.backend.module.task.dto;

import java.time.LocalDate;

public record UpdateTaskRequest(
        String title,
        LocalDate date,
        Boolean completed,
        Integer position
) {}
