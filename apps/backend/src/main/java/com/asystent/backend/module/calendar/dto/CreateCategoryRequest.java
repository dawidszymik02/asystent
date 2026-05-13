package com.asystent.backend.module.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCategoryRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String color;

    private String icon;
}
