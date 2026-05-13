package com.asystent.backend.module.calendar.service;

import com.asystent.backend.module.calendar.dto.CalendarEventDto;
import com.asystent.backend.module.calendar.entity.CalendarCategory;
import com.asystent.backend.module.calendar.entity.CalendarEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class RecurrenceService {

    private static final Logger log = LoggerFactory.getLogger(RecurrenceService.class);
    private static final int MAX_OCCURRENCES = 500;

    public List<CalendarEventDto> expandRecurringEvents(
            List<CalendarEvent> events,
            Map<UUID, CalendarCategory> categoriesById,
            OffsetDateTime from,
            OffsetDateTime to) {

        List<CalendarEventDto> result = new ArrayList<>();
        for (CalendarEvent event : events) {
            if (event.getRecurrenceRule() == null || event.getRecurrenceRule().isBlank()) {
                result.add(buildDto(event, categoriesById, event.getStartTime(), event.getEndTime(), null));
            } else if (from != null && to != null) {
                result.addAll(generateOccurrences(event, categoriesById, from, to));
            } else {
                result.add(buildDto(event, categoriesById, event.getStartTime(), event.getEndTime(), null));
            }
        }
        return result;
    }

    private List<CalendarEventDto> generateOccurrences(
            CalendarEvent event,
            Map<UUID, CalendarCategory> categoriesById,
            OffsetDateTime from,
            OffsetDateTime to) {

        Set<String> excludedDates = parseExcludedDates(event.getExcludedDates());

        Map<String, String> rrule;
        try {
            rrule = parseRRule(event.getRecurrenceRule());
        } catch (Exception e) {
            log.warn("Invalid RRULE for event {}: {}", event.getId(), event.getRecurrenceRule());
            return List.of(buildDto(event, categoriesById, event.getStartTime(), event.getEndTime(), null));
        }

        String freq = rrule.get("FREQ");
        if (freq == null) {
            return List.of(buildDto(event, categoriesById, event.getStartTime(), event.getEndTime(), null));
        }

        int interval = 1;
        try {
            interval = Integer.parseInt(rrule.getOrDefault("INTERVAL", "1"));
        } catch (NumberFormatException ignored) { }

        int maxCount = MAX_OCCURRENCES;
        if (rrule.containsKey("COUNT")) {
            try {
                maxCount = Math.min(Integer.parseInt(rrule.get("COUNT")), MAX_OCCURRENCES);
            } catch (NumberFormatException ignored) { }
        }

        OffsetDateTime until = null;
        if (rrule.containsKey("UNTIL")) {
            try {
                until = parseUntil(rrule.get("UNTIL"));
            } catch (Exception e) {
                log.warn("Invalid UNTIL for event {}: {}", event.getId(), rrule.get("UNTIL"));
            }
        }
        if (event.getRecurrenceEndDate() != null) {
            until = (until == null || event.getRecurrenceEndDate().isBefore(until))
                    ? event.getRecurrenceEndDate() : until;
        }

        Duration duration = (event.getEndTime() != null)
                ? Duration.between(event.getStartTime(), event.getEndTime()) : null;

        List<OffsetDateTime> starts = computeOccurrenceStarts(
                freq, interval, rrule, event.getStartTime(), from, to, until, maxCount);

        List<CalendarEventDto> occurrences = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        for (OffsetDateTime start : starts) {
            String key = start.withOffsetSameInstant(ZoneOffset.UTC).format(fmt);
            if (excludedDates.contains(key)) continue;
            OffsetDateTime end = (duration != null) ? start.plus(duration) : null;
            occurrences.add(buildDto(event, categoriesById, start, end, event.getId()));
        }
        return occurrences;
    }

    private List<OffsetDateTime> computeOccurrenceStarts(
            String freq,
            int interval,
            Map<String, String> rrule,
            OffsetDateTime eventStart,
            OffsetDateTime from,
            OffsetDateTime to,
            OffsetDateTime until,
            int maxCount) {

        List<OffsetDateTime> result = new ArrayList<>();
        OffsetDateTime hardLimit = (until != null && until.isBefore(to)) ? until : to;
        int count = 0;

        switch (freq.toUpperCase()) {
            case "DAILY" -> {
                OffsetDateTime current = eventStart;
                while (!current.isAfter(hardLimit) && count < maxCount) {
                    if (!current.isBefore(from)) result.add(current);
                    count++;
                    current = current.plusDays(interval);
                }
            }
            case "WEEKLY" -> {
                Set<DayOfWeek> byDay = parseByDay(rrule.getOrDefault("BYDAY", ""));
                if (byDay.isEmpty()) byDay.add(eventStart.getDayOfWeek());

                List<DayOfWeek> sortedDays = byDay.stream()
                        .sorted(Comparator.comparingInt(DayOfWeek::getValue))
                        .toList();

                // Monday of the week containing eventStart (preserves time-of-day)
                OffsetDateTime weekMonday = eventStart.minusDays(eventStart.getDayOfWeek().getValue() - 1);

                boolean done = false;
                while (!done && count < maxCount) {
                    for (DayOfWeek day : sortedDays) {
                        // DayOfWeek.MONDAY.getValue() == 1, so offset from Monday is (day.getValue() - 1)
                        OffsetDateTime occDate = weekMonday.plusDays(day.getValue() - 1);
                        if (occDate.isBefore(eventStart)) continue;
                        if (occDate.isAfter(hardLimit)) { done = true; break; }
                        if (!occDate.isBefore(from)) result.add(occDate);
                        count++;
                        if (count >= maxCount) { done = true; break; }
                    }
                    if (!done) {
                        weekMonday = weekMonday.plusWeeks(interval);
                        if (weekMonday.isAfter(hardLimit)) done = true;
                    }
                }
            }
            case "MONTHLY" -> {
                int targetDay = eventStart.getDayOfMonth();
                if (rrule.containsKey("BYMONTHDAY")) {
                    try {
                        targetDay = Integer.parseInt(rrule.get("BYMONTHDAY"));
                    } catch (NumberFormatException ignored) { }
                }

                OffsetDateTime monthBase = eventStart.withDayOfMonth(1);
                while (count < maxCount) {
                    if (monthBase.isAfter(hardLimit)) break;
                    int actualDay = Math.min(targetDay, monthBase.toLocalDate().lengthOfMonth());
                    OffsetDateTime occDate = monthBase.withDayOfMonth(actualDay);

                    if (!occDate.isBefore(eventStart)) {
                        if (occDate.isAfter(hardLimit)) break;
                        if (!occDate.isBefore(from)) result.add(occDate);
                        count++;
                    }
                    monthBase = monthBase.plusMonths(interval);
                }
            }
            case "YEARLY" -> {
                OffsetDateTime current = eventStart;
                while (!current.isAfter(hardLimit) && count < maxCount) {
                    if (!current.isBefore(from)) result.add(current);
                    count++;
                    current = current.plusYears(interval);
                }
            }
            default -> log.warn("Unsupported FREQ in RRULE: {}", freq);
        }

        return result;
    }

    private Map<String, String> parseRRule(String rrule) {
        Map<String, String> map = new LinkedHashMap<>();
        for (String part : rrule.split(";")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2) map.put(kv[0].toUpperCase().trim(), kv[1].trim());
        }
        return map;
    }

    private Set<DayOfWeek> parseByDay(String byday) {
        Set<DayOfWeek> result = new LinkedHashSet<>();
        if (byday == null || byday.isBlank()) return result;
        Map<String, DayOfWeek> dayMap = Map.of(
                "MO", DayOfWeek.MONDAY, "TU", DayOfWeek.TUESDAY,
                "WE", DayOfWeek.WEDNESDAY, "TH", DayOfWeek.THURSDAY,
                "FR", DayOfWeek.FRIDAY, "SA", DayOfWeek.SATURDAY,
                "SU", DayOfWeek.SUNDAY);
        for (String d : byday.split(",")) {
            DayOfWeek dow = dayMap.get(d.toUpperCase().trim());
            if (dow != null) result.add(dow);
        }
        return result;
    }

    private OffsetDateTime parseUntil(String until) {
        if (until.length() == 8) {
            return LocalDate.parse(until, DateTimeFormatter.BASIC_ISO_DATE)
                    .atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        }
        if (until.endsWith("Z")) {
            return LocalDateTime.parse(until, DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"))
                    .atOffset(ZoneOffset.UTC);
        }
        return LocalDateTime.parse(until, DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss"))
                .atOffset(ZoneOffset.UTC);
    }

    private Set<String> parseExcludedDates(String json) {
        if (json == null || json.isBlank()) return Set.of();
        Set<String> result = new HashSet<>();
        String s = json.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        for (String part : s.split(",")) {
            String d = part.trim().replace("\"", "");
            if (!d.isEmpty()) result.add(d);
        }
        return result;
    }

    private CalendarEventDto buildDto(
            CalendarEvent event,
            Map<UUID, CalendarCategory> categoriesById,
            OffsetDateTime startTime,
            OffsetDateTime endTime,
            UUID recurrenceParentId) {

        CalendarCategory category = event.getCategoryId() != null
                ? categoriesById.get(event.getCategoryId()) : null;

        return CalendarEventDto.builder()
                .id(event.getId())
                .userId(event.getUserId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(startTime)
                .endTime(endTime)
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
                .recurrenceParentId(recurrenceParentId)
                .build();
    }
}
