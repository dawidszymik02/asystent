package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkTaskNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkTaskNoteRepository extends JpaRepository<WorkTaskNote, UUID> {

    List<WorkTaskNote> findAllByTaskIdOrderByCreatedAtAsc(UUID taskId);
}
