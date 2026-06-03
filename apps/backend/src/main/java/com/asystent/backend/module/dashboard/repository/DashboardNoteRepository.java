package com.asystent.backend.module.dashboard.repository;

import com.asystent.backend.module.dashboard.entity.DashboardNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DashboardNoteRepository extends JpaRepository<DashboardNote, UUID> {
    Optional<DashboardNote> findByUserId(UUID userId);
}
