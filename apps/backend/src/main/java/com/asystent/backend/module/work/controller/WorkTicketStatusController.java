package com.asystent.backend.module.work.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.work.dto.WorkTicketStatusDto;
import com.asystent.backend.module.work.dto.WorkTicketStatusRequest;
import com.asystent.backend.module.work.service.WorkTicketStatusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work/ticket-statuses")
public class WorkTicketStatusController {

    private final WorkTicketStatusService statusService;

    public WorkTicketStatusController(WorkTicketStatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkTicketStatusDto>>> getStatuses(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(statusService.getStatuses(getUserId(auth))));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<WorkTicketStatusDto>>> getAllStatuses(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(statusService.getAllStatuses(getUserId(auth))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkTicketStatusDto>> createStatus(
            Authentication auth,
            @Valid @RequestBody WorkTicketStatusRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(statusService.createStatus(getUserId(auth), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkTicketStatusDto>> updateStatus(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody WorkTicketStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(statusService.updateStatus(getUserId(auth), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatus(
            Authentication auth,
            @PathVariable UUID id) {
        statusService.deleteStatus(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
