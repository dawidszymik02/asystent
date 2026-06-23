package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, UUID> {

    void deleteAllByDocumentId(UUID documentId);

    long countByDocumentId(UUID documentId);
}
