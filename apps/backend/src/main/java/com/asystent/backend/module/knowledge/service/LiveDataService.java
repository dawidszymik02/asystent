package com.asystent.backend.module.knowledge.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.knowledge.dto.EventSummary;
import com.asystent.backend.module.knowledge.dto.TaskSummary;
import com.asystent.backend.module.knowledge.dto.TicketDetails;
import com.asystent.backend.module.knowledge.dto.TicketSummary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Agreguje "live" dane z modułów Praca i Kalendarz jako kontekst dla agenta AI.
 */
@Slf4j
@Service
public class LiveDataService {

    private final JdbcClient jdbcClient;

    public LiveDataService(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public List<TicketSummary> getOpenTickets(UUID userId) {
        String sql = """
                SELECT wt.id, wt.title, wt.client_name, wp.name AS program_name,
                       COALESCE(ws.label, wt.status) AS status_name, wt.created_at
                FROM work_tickets wt
                LEFT JOIN work_clients wc ON wc.user_id = wt.user_id AND wc.name = wt.client_name
                LEFT JOIN work_programs wp ON wp.id = wt.program_id
                LEFT JOIN work_ticket_statuses ws ON ws.user_id = wt.user_id AND ws.key = wt.status
                WHERE wt.user_id = :userId AND wt.status <> 'closed'
                ORDER BY wt.created_at DESC
                LIMIT 20
                """;

        return jdbcClient.sql(sql)
                .param("userId", userId)
                .query((rs, rowNum) -> new TicketSummary(
                        (UUID) rs.getObject("id"),
                        rs.getString("title"),
                        rs.getString("client_name"),
                        rs.getString("program_name"),
                        rs.getString("status_name"),
                        toLocalDateTime(rs.getTimestamp("created_at"))
                ))
                .list();
    }

    public List<EventSummary> getTodayEvents(UUID userId) {
        return getEventsForDate(userId, LocalDate.now());
    }

    public List<EventSummary> getTomorrowEvents(UUID userId) {
        return getEventsForDate(userId, LocalDate.now().plusDays(1));
    }

    public List<EventSummary> getYesterdayEvents(UUID userId) {
        return getEventsForDate(userId, LocalDate.now().minusDays(1));
    }

    private List<EventSummary> getEventsForDate(UUID userId, LocalDate date) {
        OffsetDateTime startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        OffsetDateTime endOfDay = startOfDay.plusDays(1);

        String sql = """
                SELECT id, title, start_time, end_time, description
                FROM calendar_events
                WHERE user_id = :userId
                  AND is_cancelled = false
                  AND start_time >= :startOfDay AND start_time < :endOfDay
                ORDER BY start_time ASC
                """;

        return jdbcClient.sql(sql)
                .param("userId", userId)
                .param("startOfDay", startOfDay)
                .param("endOfDay", endOfDay)
                .query((rs, rowNum) -> new EventSummary(
                        (UUID) rs.getObject("id"),
                        rs.getString("title"),
                        toLocalDateTime(rs.getTimestamp("start_time")),
                        toLocalDateTime(rs.getTimestamp("end_time")),
                        rs.getString("description")
                ))
                .list();
    }

    public List<TaskSummary> getTodayTasks(UUID userId) {
        return getTasksForDate(userId, LocalDate.now());
    }

    public List<TaskSummary> getTomorrowTasks(UUID userId) {
        return getTasksForDate(userId, LocalDate.now().plusDays(1));
    }

    public List<TaskSummary> getYesterdayTasks(UUID userId) {
        return getTasksForDate(userId, LocalDate.now().minusDays(1));
    }

    /**
     * Kolumny "priority"/"due_date" nie istnieją w tabeli tasks (jest date/completed/position),
     * więc sortowanie odbywa się po position, a priority jest pomijane w TaskSummary.
     */
    private List<TaskSummary> getTasksForDate(UUID userId, LocalDate date) {
        String sql = """
                SELECT id, title, date
                FROM tasks
                WHERE user_id = :userId AND date = :date AND completed = false
                ORDER BY position ASC
                """;

        return jdbcClient.sql(sql)
                .param("userId", userId)
                .param("date", date)
                .query((rs, rowNum) -> new TaskSummary(
                        (UUID) rs.getObject("id"),
                        rs.getString("title"),
                        rs.getObject("date", LocalDate.class).atStartOfDay()
                ))
                .list();
    }

    public TicketDetails getTicketDetails(UUID userId, UUID ticketId) {
        String sql = """
                SELECT wt.id, wt.title, wt.description, wt.client_name, wp.name AS program_name,
                       COALESCE(ws.label, wt.status) AS status_name, wt.created_at
                FROM work_tickets wt
                LEFT JOIN work_clients wc ON wc.user_id = wt.user_id AND wc.name = wt.client_name
                LEFT JOIN work_programs wp ON wp.id = wt.program_id
                LEFT JOIN work_ticket_statuses ws ON ws.user_id = wt.user_id AND ws.key = wt.status
                WHERE wt.id = :ticketId AND wt.user_id = :userId
                """;

        TicketDetails details = jdbcClient.sql(sql)
                .param("ticketId", ticketId)
                .param("userId", userId)
                .query((rs, rowNum) -> new TicketDetails(
                        (UUID) rs.getObject("id"),
                        rs.getString("title"),
                        rs.getString("description"),
                        rs.getString("client_name"),
                        rs.getString("program_name"),
                        rs.getString("status_name"),
                        List.of(),
                        toLocalDateTime(rs.getTimestamp("created_at"))
                ))
                .optional()
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        List<String> notes = jdbcClient.sql("""
                        SELECT content FROM work_ticket_notes
                        WHERE ticket_id = :ticketId AND user_id = :userId
                        ORDER BY created_at ASC
                        """)
                .param("ticketId", ticketId)
                .param("userId", userId)
                .query((rs, rowNum) -> rs.getString("content"))
                .list();

        return new TicketDetails(
                details.id(),
                details.title(),
                details.description(),
                details.clientName(),
                details.programName(),
                details.statusName(),
                notes,
                details.createdAt()
        );
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
