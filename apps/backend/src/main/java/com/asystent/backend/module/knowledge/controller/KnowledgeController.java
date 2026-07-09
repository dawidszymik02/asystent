package com.asystent.backend.module.knowledge.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.knowledge.dto.CreateDocumentRequest;
import com.asystent.backend.module.knowledge.dto.DocumentResponse;
import com.asystent.backend.module.knowledge.dto.SearchRequest;
import com.asystent.backend.module.knowledge.dto.SearchResponse;
import com.asystent.backend.module.knowledge.dto.TagResponse;
import com.asystent.backend.module.knowledge.service.KnowledgeService;
import com.asystent.backend.module.knowledge.service.SearchService;
import com.asystent.backend.module.knowledge.service.TagService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;
    private final TagService tagService;
    private final SearchService searchService;

    public KnowledgeController(KnowledgeService knowledgeService, TagService tagService, SearchService searchService) {
        this.knowledgeService = knowledgeService;
        this.tagService = tagService;
        this.searchService = searchService;
    }

    @PostMapping("/documents")
    public ResponseEntity<ApiResponse<DocumentResponse>> importDocument(
            Authentication auth,
            @Valid @RequestBody CreateDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(knowledgeService.importDocument(getUserId(auth), request)));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocuments(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(knowledgeService.getDocuments(getUserId(auth))));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(
            Authentication auth,
            @PathVariable UUID id) {
        knowledgeService.deleteDocument(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            Authentication auth,
            @Valid @RequestBody SearchRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(searchService.search(getUserId(auth), request)));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTags(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(tagService.getAllTags(getUserId(auth))));
    }

    @GetMapping("/tags/search")
    public ResponseEntity<ApiResponse<List<TagResponse>>> searchTags(
            Authentication auth,
            @RequestParam @NotBlank String q) {
        return ResponseEntity.ok(ApiResponse.ok(tagService.searchTags(getUserId(auth), q)));
    }

    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(tagService.createTag(getUserId(auth), name)));
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> deleteTag(
            Authentication auth,
            @PathVariable UUID id) {
        tagService.deleteTag(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
