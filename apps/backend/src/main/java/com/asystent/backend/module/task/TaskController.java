package com.asystent.backend.module.task;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.task.dto.CreateTaskRequest;
import com.asystent.backend.module.task.dto.TaskResponse;
import com.asystent.backend.module.task.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
            Authentication auth,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasksForDate(getUserId(auth), date)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            Authentication auth,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(taskService.createTask(getUserId(auth), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.updateTask(getUserId(auth), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            Authentication auth,
            @PathVariable UUID id) {
        taskService.deleteTask(getUserId(auth), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleComplete(
            Authentication auth,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.toggleComplete(getUserId(auth), id)));
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
