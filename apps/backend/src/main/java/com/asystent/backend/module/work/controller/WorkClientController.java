package com.asystent.backend.module.work.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.work.dto.WorkClientDto;
import com.asystent.backend.module.work.dto.WorkClientRequest;
import com.asystent.backend.module.work.service.WorkClientService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work/clients")
public class WorkClientController {

    private final WorkClientService clientService;

    public WorkClientController(WorkClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkClientDto>>> getClients(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(clientService.getClients(getUserId(auth))));
    }

    @PostMapping("/find-or-create")
    public ResponseEntity<ApiResponse<WorkClientDto>> findOrCreate(
            Authentication auth,
            @Valid @RequestBody WorkClientRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(clientService.findOrCreate(getUserId(auth), request.name())));
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
