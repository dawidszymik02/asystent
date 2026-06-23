package com.asystent.backend.module.knowledge.repository;

import com.asystent.backend.module.knowledge.entity.KnowledgeTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KnowledgeTagRepository extends JpaRepository<KnowledgeTag, UUID> {

    List<KnowledgeTag> findAllByUserId(UUID userId);

    List<KnowledgeTag> findByUserIdAndNameContainingIgnoreCase(UUID userId, String query);

    Optional<KnowledgeTag> findByUserIdAndName(UUID userId, String name);

    @Modifying
    @Transactional
    @Query("DELETE FROM KnowledgeTag t WHERE t.id = :id AND t.userId = :userId")
    void deleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT t FROM KnowledgeTag t JOIN KnowledgeDocumentTag kdt ON kdt.id.tagId = t.id WHERE kdt.id.documentId = :documentId")
    List<KnowledgeTag> findByDocumentId(@Param("documentId") UUID documentId);
}
