package com.asystent.backend.module.knowledge.service;

import com.asystent.backend.module.knowledge.dto.TagResponse;
import com.asystent.backend.module.knowledge.entity.KnowledgeDocumentTag;
import com.asystent.backend.module.knowledge.entity.KnowledgeDocumentTagId;
import com.asystent.backend.module.knowledge.entity.KnowledgeTag;
import com.asystent.backend.module.knowledge.repository.KnowledgeDocumentTagRepository;
import com.asystent.backend.module.knowledge.repository.KnowledgeTagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TagService {

    private final KnowledgeTagRepository tagRepository;
    private final KnowledgeDocumentTagRepository documentTagRepository;

    public TagService(KnowledgeTagRepository tagRepository, KnowledgeDocumentTagRepository documentTagRepository) {
        this.tagRepository = tagRepository;
        this.documentTagRepository = documentTagRepository;
    }

    public List<TagResponse> getAllTags(UUID userId) {
        return tagRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TagResponse> searchTags(UUID userId, String query) {
        return tagRepository.findByUserIdAndNameContainingIgnoreCase(userId, query).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TagResponse createTag(UUID userId, String name) {
        return tagRepository.findByUserIdAndName(userId, name)
                .map(this::toResponse)
                .orElseGet(() -> {
                    KnowledgeTag tag = new KnowledgeTag();
                    tag.setUserId(userId);
                    tag.setName(name);
                    return toResponse(tagRepository.save(tag));
                });
    }

    @Transactional
    public void deleteTag(UUID userId, UUID tagId) {
        tagRepository.deleteByIdAndUserId(tagId, userId);
    }

    @Transactional
    public void setDocumentTags(UUID documentId, List<UUID> tagIds) {
        documentTagRepository.deleteByIdDocumentId(documentId);
        for (UUID tagId : tagIds) {
            documentTagRepository.save(new KnowledgeDocumentTag(new KnowledgeDocumentTagId(documentId, tagId)));
        }
    }

    public List<TagResponse> getDocumentTags(UUID documentId) {
        return tagRepository.findByDocumentId(documentId).stream()
                .map(this::toResponse)
                .toList();
    }

    private TagResponse toResponse(KnowledgeTag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getCreatedAt());
    }
}
