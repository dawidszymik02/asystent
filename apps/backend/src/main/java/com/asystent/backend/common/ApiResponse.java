package com.asystent.backend.common;

import lombok.Getter;

import java.time.Instant;

@Getter
public class ApiResponse<T> {

    private final T data;
    private final String error;
    private final String timestamp;

    private ApiResponse(T data, String error) {
        this.data = data;
        this.error = error;
        this.timestamp = Instant.now().toString();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(null, message);
    }
}
