package com.asystent.backend.module.dashboard.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.dashboard.dto.DashboardNoteDto;
import com.asystent.backend.module.dashboard.dto.DashboardNoteRequest;
import com.asystent.backend.module.dashboard.service.DashboardNoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard/note")
public class DashboardNoteController {

    private final DashboardNoteService noteService;

    public DashboardNoteController(DashboardNoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardNoteDto>> getNote(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(noteService.getNote(getUserId(auth))));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<DashboardNoteDto>> saveNote(
            Authentication auth,
            @Valid @RequestBody DashboardNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(noteService.saveNote(getUserId(auth), request)));
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
