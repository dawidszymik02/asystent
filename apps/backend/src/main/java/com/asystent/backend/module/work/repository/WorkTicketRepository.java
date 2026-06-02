package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkTicketRepository extends JpaRepository<WorkTicket, UUID> {

    List<WorkTicket> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<WorkTicket> findAllByUserIdAndStatus(UUID userId, String status);

    List<WorkTicket> findAllByUserIdAndProgramId(UUID userId, UUID programId);
}
