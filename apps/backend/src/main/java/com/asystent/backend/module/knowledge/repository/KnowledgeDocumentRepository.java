package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, UUID> {

    List<KnowledgeDocument> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
