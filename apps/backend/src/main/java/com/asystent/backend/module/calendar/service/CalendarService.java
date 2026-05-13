package com.asystent.backend.module.calendar.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.calendar.dto.*;
import com.asystent.backend.module.calendar.entity.CalendarCategory;
import com.asystent.backend.module.calendar.entity.CalendarEvent;
import com.asystent.backend.module.calendar.repository.CalendarCategoryRepository;
import com.asystent.backend.module.calendar.repository.CalendarEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CalendarService {

    private final CalendarEventRepository eventRepository;
    private final CalendarCategoryRepository categoryRepository;
    private final RecurrenceService recurrenceService;

    public CalendarService(CalendarEventRepository eventRepository,
                           CalendarCategoryRepository categoryRepository,
                           RecurrenceService recurrenceService) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.recurrenceService = recurrenceService;
    }

    public List<CalendarEventDto> getEvents(UUID userId, OffsetDateTime from, OffsetDateTime to) {
        try {
            List<CalendarEvent> events = (from == null || to == null)
                    ? eventRepository.findByUserIdAndIsCancelledFalseOrderByStartTimeAsc(userId)
                    : eventRepository.findEventsForExpansion(userId, from, to);

            Map<UUID, CalendarCategory> categoriesById = loadCategoriesMap(userId);
            List<CalendarEventDto> expanded = recurrenceService.expandRecurringEvents(events, categoriesById, from, to);
            return expanded.stream()
                    .sorted(java.util.Comparator.comparing(
                            CalendarEventDto::getStartTime,
                            java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                    .toList();
        } catch (Exception e) {
            log.error("Error fetching events for user {}: ", userId, e);
            throw e;
        }
    }

    public CalendarEventDto getEvent(UUID userId, UUID eventId) {
        CalendarEvent event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        Map<UUID, CalendarCategory> categoriesById = loadCategoriesMap(userId);
        return toEventDto(event, categoriesById);
    }

    @Transactional
    public CalendarEventDto createEvent(UUID userId, CreateEventRequest req) {
        CalendarEvent event = new CalendarEvent();
        event.setUserId(userId);
        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setStartTime(req.getStartTime());
        event.setEndTime(req.getEndTime());
        event.setIsAllDay(req.getIsAllDay() != null ? req.getIsAllDay() : false);
        event.setCategoryId(req.getCategoryId());
        event.setLocation(req.getLocation());
        event.setColor(req.getColor() != null ? req.getColor() : "#3B82F6");
        event.setRecurrenceRule(req.getRecurrenceRule());
        event.setRecurrenceEndDate(req.getRecurrenceEndDate());
        event.setReminderMinutes(req.getReminderMinutes());

        CalendarEvent saved = eventRepository.save(event);
        Map<UUID, CalendarCategory> categoriesById = loadCategoriesMap(userId);
        return toEventDto(saved, categoriesById);
    }

    @Transactional
    public CalendarEventDto updateEvent(UUID userId, UUID eventId, UpdateEventRequest req) {
        CalendarEvent event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (req.getTitle() != null) event.setTitle(req.getTitle());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getStartTime() != null) event.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) event.setEndTime(req.getEndTime());
        if (req.getIsAllDay() != null) event.setIsAllDay(req.getIsAllDay());
        if (req.getCategoryId() != null) event.setCategoryId(req.getCategoryId());
        if (req.getLocation() != null) event.setLocation(req.getLocation());
        if (req.getColor() != null) event.setColor(req.getColor());
        if (req.getRecurrenceRule() != null) event.setRecurrenceRule(req.getRecurrenceRule());
        if (req.getRecurrenceEndDate() != null) event.setRecurrenceEndDate(req.getRecurrenceEndDate());
        if (req.getReminderMinutes() != null) event.setReminderMinutes(req.getReminderMinutes());

        CalendarEvent saved = eventRepository.save(event);
        Map<UUID, CalendarCategory> categoriesById = loadCategoriesMap(userId);
        return toEventDto(saved, categoriesById);
    }

    @Transactional
    public void deleteEvent(UUID userId, UUID eventId, String deleteMode, OffsetDateTime occurrenceDate) {
        CalendarEvent event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if ("single".equals(deleteMode) && event.getRecurrenceRule() != null && occurrenceDate != null) {
            event.setExcludedDates(addToExcludedDates(event.getExcludedDates(), occurrenceDate));
        } else {
            event.setIsCancelled(true);
        }
        eventRepository.save(event);
    }

    public List<CalendarCategoryDto> getCategories(UUID userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(this::toCategoryDto)
                .toList();
    }

    @Transactional
    public CalendarCategoryDto createCategory(UUID userId, CreateCategoryRequest req) {
        CalendarCategory category = new CalendarCategory();
        category.setUserId(userId);
        category.setName(req.getName());
        category.setColor(req.getColor());
        category.setIcon(req.getIcon());
        return toCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public CalendarCategoryDto updateCategory(UUID userId, UUID categoryId, UpdateCategoryRequest req) {
        CalendarCategory category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));

        if (req.getName() != null) category.setName(req.getName());
        if (req.getColor() != null) category.setColor(req.getColor());
        if (req.getIcon() != null) category.setIcon(req.getIcon());

        return toCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID categoryId) {
        CalendarCategory category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        categoryRepository.delete(category);
    }

    private String addToExcludedDates(String existing, OffsetDateTime date) {
        String dateStr = "\"" + date.withOffsetSameInstant(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) + "\"";
        if (existing == null || existing.isBlank() || "[]".equals(existing.trim())) {
            return "[" + dateStr + "]";
        }
        String trimmed = existing.trim();
        return trimmed.substring(0, trimmed.length() - 1) + "," + dateStr + "]";
    }

    private Map<UUID, CalendarCategory> loadCategoriesMap(UUID userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .collect(Collectors.toMap(CalendarCategory::getId, Function.identity()));
    }

    private CalendarEventDto toEventDto(CalendarEvent event, Map<UUID, CalendarCategory> categoriesById) {
        CalendarCategory category = event.getCategoryId() != null
                ? categoriesById.get(event.getCategoryId())
                : null;
        return CalendarEventDto.builder()
                .id(event.getId())
                .userId(event.getUserId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .isAllDay(event.getIsAllDay())
                .location(event.getLocation())
                .color(event.getColor())
                .sourceModule(event.getSourceModule())
                .sourceId(event.getSourceId())
                .categoryId(event.getCategoryId())
                .categoryName(category != null ? category.getName() : null)
                .categoryColor(category != null ? category.getColor() : null)
                .recurrenceRule(event.getRecurrenceRule())
                .recurrenceEndDate(event.getRecurrenceEndDate())
                .reminderMinutes(event.getReminderMinutes())
                .isCancelled(event.getIsCancelled())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private CalendarCategoryDto toCategoryDto(CalendarCategory category) {
        return CalendarCategoryDto.builder()
                .id(category.getId())
                .userId(category.getUserId())
                .name(category.getName())
                .color(category.getColor())
                .icon(category.getIcon())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
