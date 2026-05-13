package com.asystent.backend.controller;

import com.asystent.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verify(
            @AuthenticationPrincipal String userId) {

        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("No valid token provided"));
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "userId", userId,
            "authenticated", true
        )));
    }
}
