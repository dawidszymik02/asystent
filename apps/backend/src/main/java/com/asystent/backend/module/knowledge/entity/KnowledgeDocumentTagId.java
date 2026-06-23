package com.asystent.backend.module.knowledge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class KnowledgeDocumentTagId implements Serializable {

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "tag_id")
    private UUID tagId;
}
