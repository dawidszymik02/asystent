package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.KnowledgeDocumentTag;
import com.asystent.backend.module.knowledge.entity.KnowledgeDocumentTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface KnowledgeDocumentTagRepository extends JpaRepository<KnowledgeDocumentTag, KnowledgeDocumentTagId> {

    @Modifying
    @Transactional
    void deleteByIdDocumentId(UUID documentId);
}
