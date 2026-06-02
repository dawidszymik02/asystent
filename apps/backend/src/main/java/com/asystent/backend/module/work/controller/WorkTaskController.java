package com.asystent.backend.module.work.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.work.dto.WorkTaskDto;
import com.asystent.backend.module.work.dto.WorkTaskRequest;
import com.asystent.backend.module.work.service.WorkTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work/tasks")
public class WorkTaskController {

    private final WorkTaskService taskService;

    public WorkTaskController(WorkTaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkTaskDto>>> getTasks(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasks(getUserId(auth))));
    }

    @GetMapping("/by-status")
    public ResponseEntity<ApiResponse<List<WorkTaskDto>>> getTasksByStatus(
            Authentication auth,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasksByStatus(getUserId(auth), status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkTaskDto>> getTask(
            Authentication auth,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTask(getUserId(auth), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkTaskDto>> createTask(
            Authentication auth,
            @Valid @RequestBody WorkTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(taskService.createTask(getUserId(auth), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkTaskDto>> updateTask(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody WorkTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.updateTask(getUserId(auth), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            Authentication auth,
            @PathVariable UUID id) {
        taskService.deleteTask(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
