package com.asystent.backend.module.calendar.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.calendar.dto.*;
import com.asystent.backend.module.calendar.service.CalendarService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<CalendarEventDto>>> getEvents(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return ResponseEntity.ok(ApiResponse.ok(calendarService.getEvents(getUserId(auth), from, to)));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ApiResponse<CalendarEventDto>> getEvent(
            Authentication auth,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(calendarService.getEvent(getUserId(auth), id)));
    }

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<CalendarEventDto>> createEvent(
            Authentication auth,
            @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(calendarService.createEvent(getUserId(auth), request)));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<ApiResponse<CalendarEventDto>> updateEvent(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(calendarService.updateEvent(getUserId(auth), id, request)));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            Authentication auth,
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "all") String deleteMode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime occurrenceDate) {
        calendarService.deleteEvent(getUserId(auth), id, deleteMode, occurrenceDate);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CalendarCategoryDto>>> getCategories(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(calendarService.getCategories(getUserId(auth))));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CalendarCategoryDto>> createCategory(
            Authentication auth,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(calendarService.createCategory(getUserId(auth), request)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CalendarCategoryDto>> updateCategory(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(calendarService.updateCategory(getUserId(auth), id, request)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            Authentication auth,
            @PathVariable UUID id) {
        calendarService.deleteCategory(getUserId(auth), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
