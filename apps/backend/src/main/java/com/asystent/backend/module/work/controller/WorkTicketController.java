package com.asystent.backend.module.work.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.work.dto.WorkTicketDto;
import com.asystent.backend.module.work.dto.WorkTicketNoteDto;
import com.asystent.backend.module.work.dto.WorkTicketNoteRequest;
import com.asystent.backend.module.work.dto.WorkTicketRequest;
import com.asystent.backend.module.work.service.WorkTicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work/tickets")
public class WorkTicketController {

    private final WorkTicketService ticketService;

    public WorkTicketController(WorkTicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkTicketDto>>> getTickets(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.getTickets(getUserId(auth))));
    }

    @GetMapping("/by-status")
    public ResponseEntity<ApiResponse<List<WorkTicketDto>>> getTicketsByStatus(
            Authentication auth,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.getTicketsByStatus(getUserId(auth), status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkTicketDto>> getTicket(
            Authentication auth,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.getTicket(getUserId(auth), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkTicketDto>> createTicket(
            Authentication auth,
            @Valid @RequestBody WorkTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ticketService.createTicket(getUserId(auth), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkTicketDto>> updateTicket(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody WorkTicketRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.updateTicket(getUserId(auth), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            Authentication auth,
            @PathVariable UUID id) {
        ticketService.deleteTicket(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<List<WorkTicketNoteDto>>> getNotes(
            Authentication auth,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.getNotes(getUserId(auth), id)));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<WorkTicketNoteDto>> addNote(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody WorkTicketNoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ticketService.addNote(getUserId(auth), id, request)));
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
