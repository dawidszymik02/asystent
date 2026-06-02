package com.asystent.backend.module.work.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.work.dto.WorkProgramDto;
import com.asystent.backend.module.work.dto.WorkProgramRequest;
import com.asystent.backend.module.work.service.WorkProgramService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work/programs")
public class WorkProgramController {

    private final WorkProgramService programService;

    public WorkProgramController(WorkProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkProgramDto>>> getPrograms(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(programService.getPrograms(getUserId(auth))));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<WorkProgramDto>>> getAllPrograms(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(programService.getAllPrograms(getUserId(auth))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkProgramDto>> createProgram(
            Authentication auth,
            @Valid @RequestBody WorkProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(programService.createProgram(getUserId(auth), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkProgramDto>> updateProgram(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody WorkProgramRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(programService.updateProgram(getUserId(auth), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgram(
            Authentication auth,
            @PathVariable UUID id) {
        programService.deleteProgram(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
