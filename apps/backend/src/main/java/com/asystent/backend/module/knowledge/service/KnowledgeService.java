package com.asystent.backend.module.knowledge.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.knowledge.dto.CreateDocumentRequest;
import com.asystent.backend.module.knowledge.dto.DocumentResponse;
import com.asystent.backend.module.knowledge.entity.KnowledgeDocument;
import com.asystent.backend.module.knowledge.repository.KnowledgeChunkRepository;
import com.asystent.backend.module.knowledge.repository.KnowledgeDocumentRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class KnowledgeService {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final ChunkingService chunkingService;
    private final EmbeddingService embeddingService;
    private final TagService tagService;

    @PersistenceContext
    private EntityManager entityManager;

    public KnowledgeService(
            KnowledgeDocumentRepository documentRepository,
            KnowledgeChunkRepository chunkRepository,
            ChunkingService chunkingService,
            EmbeddingService embeddingService,
            TagService tagService) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.chunkingService = chunkingService;
        this.embeddingService = embeddingService;
        this.tagService = tagService;
    }

    @Transactional
    public DocumentResponse importDocument(UUID userId, CreateDocumentRequest req) {
        log.info("Importing document '{}' for user {}", req.title(), userId);

        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setUserId(userId);
        doc.setTitle(req.title());
        doc.setType(req.type() != null ? req.type() : "NOTE");
        doc.setContentRaw(req.contentRaw());
        documentRepository.save(doc);
        log.info("Saved document {}", doc.getId());

        List<String> chunks = chunkingService.chunkText(req.contentRaw());
        log.info("Created {} chunks for document {}", chunks.size(), doc.getId());

        List<float[]> embeddings = embeddingService.generateEmbeddings(chunks);
        log.info("Generated {} embeddings for document {}", embeddings.size(), doc.getId());

        for (int i = 0; i < chunks.size(); i++) {
            entityManager.createNativeQuery(
                    "INSERT INTO knowledge_chunks (id, document_id, content, chunk_index, embedding, created_at) " +
                    "VALUES (gen_random_uuid(), :docId, :content, :idx, CAST(:emb AS vector), NOW())"
            )
            .setParameter("docId", doc.getId())
            .setParameter("content", chunks.get(i))
            .setParameter("idx", i)
            .setParameter("emb", formatEmbedding(embeddings.get(i)))
            .executeUpdate();
        }
        log.info("Saved {} chunks for document {}", chunks.size(), doc.getId());

        if (req.tagIds() != null && !req.tagIds().isEmpty()) {
            tagService.setDocumentTags(doc.getId(), req.tagIds());
        }

        return new DocumentResponse(
                doc.getId(), doc.getTitle(), doc.getType(),
                chunks.size(), doc.getCreatedAt(),
                tagService.getDocumentTags(doc.getId()));
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocuments(UUID userId) {
        return documentRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(doc -> new DocumentResponse(
                        doc.getId(),
                        doc.getTitle(),
                        doc.getType(),
                        (int) chunkRepository.countByDocumentId(doc.getId()),
                        doc.getCreatedAt(),
                        tagService.getDocumentTags(doc.getId())))
                .toList();
    }

    @Transactional
    public void deleteDocument(UUID userId, UUID id) {
        KnowledgeDocument doc = documentRepository.findById(id)
                .filter(d -> d.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        chunkRepository.deleteAllByDocumentId(doc.getId());
        documentRepository.delete(doc);
        log.info("Deleted document {} and its chunks", id);
    }

    private String formatEmbedding(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
