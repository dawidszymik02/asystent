package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkProgramRepository extends JpaRepository<WorkProgram, UUID> {

    List<WorkProgram> findAllByUserIdAndIsActiveTrueOrderByNameAsc(UUID userId);

    List<WorkProgram> findAllByUserIdOrderByNameAsc(UUID userId);
}
