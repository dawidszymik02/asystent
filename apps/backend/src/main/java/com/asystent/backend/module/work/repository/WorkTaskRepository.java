package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkTaskRepository extends JpaRepository<WorkTask, UUID> {

    List<WorkTask> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<WorkTask> findAllByUserIdAndStatus(UUID userId, String status);

    List<WorkTask> findAllByUserIdAndDueDateBetween(UUID userId, OffsetDateTime from, OffsetDateTime to);
}
