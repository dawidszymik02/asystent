package com.asystent.backend.module.work.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.work.WorkMapper;
import com.asystent.backend.module.work.dto.WorkTicketDto;
import com.asystent.backend.module.work.dto.WorkTicketNoteDto;
import com.asystent.backend.module.work.dto.WorkTicketNoteRequest;
import com.asystent.backend.module.work.dto.WorkTicketRequest;
import com.asystent.backend.module.work.entity.WorkTicket;
import com.asystent.backend.module.work.entity.WorkTicketNote;
import com.asystent.backend.module.work.repository.WorkTicketNoteRepository;
import com.asystent.backend.module.work.repository.WorkTicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class WorkTicketService {

    private final WorkTicketRepository ticketRepository;
    private final WorkTicketNoteRepository noteRepository;

    public WorkTicketService(WorkTicketRepository ticketRepository,
                             WorkTicketNoteRepository noteRepository) {
        this.ticketRepository = ticketRepository;
        this.noteRepository = noteRepository;
    }

    public List<WorkTicketDto> getTickets(UUID userId) {
        return ticketRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public List<WorkTicketDto> getTicketsByStatus(UUID userId, String status) {
        return ticketRepository.findAllByUserIdAndStatus(userId, status)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public WorkTicketDto getTicket(UUID userId, UUID id) {
        return WorkMapper.toDto(findOwnedTicket(userId, id));
    }

    @Transactional
    public WorkTicketDto createTicket(UUID userId, WorkTicketRequest req) {
        WorkTicket ticket = new WorkTicket();
        ticket.setUserId(userId);
        ticket.setTitle(req.title());
        ticket.setDescription(req.description());
        ticket.setClientName(req.clientName());
        ticket.setProgramId(req.programId());
        ticket.setStatus(req.status() != null ? req.status() : "new");
        ticket.setPriority(req.priority() != null ? req.priority() : "medium");
        ticket.setSourceRef(req.sourceRef());

        return WorkMapper.toDto(ticketRepository.save(ticket));
    }

    @Transactional
    public WorkTicketDto updateTicket(UUID userId, UUID id, WorkTicketRequest req) {
        WorkTicket ticket = findOwnedTicket(userId, id);

        if (req.title() != null) ticket.setTitle(req.title());
        if (req.description() != null) ticket.setDescription(req.description());
        if (req.clientName() != null) ticket.setClientName(req.clientName());
        if (req.programId() != null) ticket.setProgramId(req.programId());
        if (req.status() != null) ticket.setStatus(req.status());
        if (req.priority() != null) ticket.setPriority(req.priority());
        if (req.sourceRef() != null) ticket.setSourceRef(req.sourceRef());

        return WorkMapper.toDto(ticketRepository.save(ticket));
    }

    @Transactional
    public void deleteTicket(UUID userId, UUID id) {
        ticketRepository.delete(findOwnedTicket(userId, id));
    }

    @Transactional
    public WorkTicketNoteDto addNote(UUID userId, UUID ticketId, WorkTicketNoteRequest req) {
        findOwnedTicket(userId, ticketId);

        WorkTicketNote note = new WorkTicketNote();
        note.setTicketId(ticketId);
        note.setUserId(userId);
        note.setContent(req.content());

        return WorkMapper.toDto(noteRepository.save(note));
    }

    public List<WorkTicketNoteDto> getNotes(UUID userId, UUID ticketId) {
        findOwnedTicket(userId, ticketId);

        return noteRepository.findAllByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    private WorkTicket findOwnedTicket(UUID userId, UUID id) {
        return ticketRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }
}
