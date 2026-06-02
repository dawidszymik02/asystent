package com.asystent.backend.module.work.repository;

import com.asystent.backend.module.work.entity.WorkClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkClientRepository extends JpaRepository<WorkClient, UUID> {

    List<WorkClient> findAllByUserIdOrderByNameAsc(UUID userId);

    Optional<WorkClient> findByUserIdAndNameIgnoreCase(UUID userId, String name);
}
