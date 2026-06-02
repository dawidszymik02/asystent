package com.asystent.backend.module.work;

import com.asystent.backend.module.work.dto.*;
import com.asystent.backend.module.work.entity.*;

public final class WorkMapper {

    private WorkMapper() {}

    public static WorkProgramDto toDto(WorkProgram program) {
        return new WorkProgramDto(
                program.getId(),
                program.getUserId(),
                program.getName(),
                program.getShortCode(),
                program.getColor(),
                program.getDescription(),
                program.getIsActive(),
                program.getCreatedAt()
        );
    }

    public static WorkClientDto toDto(WorkClient client) {
        return new WorkClientDto(
                client.getId(),
                client.getUserId(),
                client.getName(),
                client.getCreatedAt()
        );
    }

    public static WorkTicketDto toDto(WorkTicket ticket) {
        return new WorkTicketDto(
                ticket.getId(),
                ticket.getUserId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getClientName(),
                ticket.getProgramId(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getSourceRef(),
                ticket.getResolvedAt(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }

    public static WorkTicketNoteDto toDto(WorkTicketNote note) {
        return new WorkTicketNoteDto(
                note.getId(),
                note.getTicketId(),
                note.getUserId(),
                note.getContent(),
                note.getCreatedAt()
        );
    }

    public static WorkTicketStatusDto toDto(WorkTicketStatus status) {
        return new WorkTicketStatusDto(
                status.getId(),
                status.getUserId(),
                status.getKey(),
                status.getLabel(),
                status.getColor(),
                status.getBgColor(),
                status.getSortOrder(),
                status.getIsActive(),
                status.getCreatedAt()
        );
    }

    public static WorkTaskDto toDto(WorkTask task) {
        return new WorkTaskDto(
                task.getId(),
                task.getUserId(),
                task.getTitle(),
                task.getDescription(),
                task.getType(),
                task.getClientName(),
                task.getProgramId(),
                task.getStatus(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
