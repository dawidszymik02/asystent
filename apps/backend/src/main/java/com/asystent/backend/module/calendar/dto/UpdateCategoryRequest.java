package com.asystent.backend.module.calendar.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCategoryRequest {
    private String name;
    private String color;
    private String icon;
}
