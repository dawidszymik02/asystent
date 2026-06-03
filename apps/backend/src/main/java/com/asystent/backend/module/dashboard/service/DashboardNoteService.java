package com.asystent.backend.module.dashboard.service;

import com.asystent.backend.module.dashboard.dto.DashboardNoteDto;
import com.asystent.backend.module.dashboard.dto.DashboardNoteRequest;
import com.asystent.backend.module.dashboard.entity.DashboardNote;
import com.asystent.backend.module.dashboard.repository.DashboardNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DashboardNoteService {

    private final DashboardNoteRepository noteRepository;

    public DashboardNoteService(DashboardNoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    public DashboardNoteDto getNote(UUID userId) {
        return noteRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseGet(() -> {
                    DashboardNote note = new DashboardNote();
                    note.setUserId(userId);
                    note.setContent("");
                    return toDto(noteRepository.save(note));
                });
    }

    @Transactional
    public DashboardNoteDto saveNote(UUID userId, DashboardNoteRequest req) {
        DashboardNote note = noteRepository.findByUserId(userId).orElseGet(() -> {
            DashboardNote n = new DashboardNote();
            n.setUserId(userId);
            return n;
        });
        note.setContent(req.content());
        return toDto(noteRepository.save(note));
    }

    private DashboardNoteDto toDto(DashboardNote note) {
        return new DashboardNoteDto(note.getId(), note.getUserId(), note.getContent(), note.getUpdatedAt());
    }
}
