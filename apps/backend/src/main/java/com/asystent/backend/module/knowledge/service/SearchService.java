package com.asystent.backend.module.knowledge.service;

import com.asystent.backend.module.knowledge.dto.SearchRequest;
import com.asystent.backend.module.knowledge.dto.SearchResponse;
import com.asystent.backend.module.knowledge.dto.SearchResultItem;
import com.asystent.backend.module.knowledge.dto.TagResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class SearchService {

    private final EmbeddingService embeddingService;
    private final TagService tagService;

    @PersistenceContext
    private EntityManager entityManager;

    public SearchService(EmbeddingService embeddingService, TagService tagService) {
        this.embeddingService = embeddingService;
        this.tagService = tagService;
    }

    @Transactional(readOnly = true)
    public SearchResponse search(UUID userId, SearchRequest request) {
        long startedAt = System.currentTimeMillis();
        log.info("Semantic search for user {}: query='{}'", userId, request.query());

        float[] queryEmbedding = embeddingService.generateEmbeddings(List.of(request.query())).get(0);
        String queryVector = formatEmbedding(queryEmbedding);

        boolean hasTagFilter = request.tagIds() != null && !request.tagIds().isEmpty();

        StringBuilder sql = new StringBuilder(
                "SELECT kc.id as chunk_id, kc.document_id, kd.title as document_title, kc.content, " +
                "1 - (kc.embedding <=> CAST(:queryVector AS vector)) as similarity " +
                "FROM knowledge_chunks kc " +
                "JOIN knowledge_documents kd ON kc.document_id = kd.id " +
                "WHERE kd.user_id = CAST(:userId AS uuid) "
        );
        if (hasTagFilter) {
            sql.append(
                    "AND kd.id IN (SELECT document_id FROM knowledge_document_tags WHERE tag_id IN (:tagIds)) "
            );
        }
        sql.append("ORDER BY kc.embedding <=> CAST(:queryVector AS vector) LIMIT :limit");

        Query nativeQuery = entityManager.createNativeQuery(sql.toString())
                .setParameter("queryVector", queryVector)
                .setParameter("userId", userId)
                .setParameter("limit", request.limit());
        if (hasTagFilter) {
            nativeQuery.setParameter("tagIds", request.tagIds());
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = nativeQuery.getResultList();

        List<SearchResultItem> results = rows.stream()
                .map(row -> {
                    UUID chunkId = (UUID) row[0];
                    UUID documentId = (UUID) row[1];
                    String documentTitle = (String) row[2];
                    String content = (String) row[3];
                    double similarity = ((Number) row[4]).doubleValue();
                    List<TagResponse> tags = tagService.getDocumentTags(documentId);
                    return new SearchResultItem(chunkId, documentId, documentTitle, content, tags, similarity);
                })
                .toList();

        long durationMs = System.currentTimeMillis() - startedAt;
        log.info("Semantic search for user {} query='{}' returned {} result(s) in {} ms",
                userId, request.query(), results.size(), durationMs);

        return new SearchResponse(request.query(), results);
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
