package com.asystent.backend.module.work.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_tasks", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class WorkTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "type", nullable = false)
    private String type = "OTHER";

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "program_id")
    private UUID programId;

    @Column(name = "status", nullable = false)
    private String status = "todo";

    @Column(name = "due_date")
    private OffsetDateTime dueDate;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
