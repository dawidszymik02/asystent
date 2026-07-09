package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.AgentConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentConversationRepository extends JpaRepository<AgentConversation, UUID> {

    List<AgentConversation> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
