package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.AgentMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentMessageRepository extends JpaRepository<AgentMessage, UUID> {

    List<AgentMessage> findTop10ByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
