package com.asystent.backend.module.knowledge.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "knowledge_document_tags", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class KnowledgeDocumentTag {

    @EmbeddedId
    private KnowledgeDocumentTagId id;

    public KnowledgeDocumentTag(KnowledgeDocumentTagId id) {
        this.id = id;
    }
}
