package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkTicketNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkTicketNoteRepository extends JpaRepository<WorkTicketNote, UUID> {

    List<WorkTicketNote> findAllByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
