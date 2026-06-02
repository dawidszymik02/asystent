package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkTicketStatusRepository extends JpaRepository<WorkTicketStatus, UUID> {

    List<WorkTicketStatus> findAllByUserIdAndIsActiveTrueOrderBySortOrderAsc(UUID userId);

    List<WorkTicketStatus> findAllByUserIdOrderBySortOrderAsc(UUID userId);

    Optional<WorkTicketStatus> findByUserIdAndKey(UUID userId, String key);
}
