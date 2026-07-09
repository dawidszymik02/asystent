package com.asystent.backend.module.work.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.work.WorkMapper;
import com.asystent.backend.module.work.dto.WorkTaskDto;
import com.asystent.backend.module.work.dto.WorkTaskNoteDto;
import com.asystent.backend.module.work.dto.WorkTaskNoteRequest;
import com.asystent.backend.module.work.dto.WorkTaskRequest;
import com.asystent.backend.module.work.entity.WorkTask;
import com.asystent.backend.module.work.entity.WorkTaskNote;
import com.asystent.backend.module.work.repository.WorkTaskNoteRepository;
import com.asystent.backend.module.work.repository.WorkTaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class WorkTaskService {

    private final WorkTaskRepository taskRepository;
    private final WorkTaskNoteRepository noteRepository;

    public WorkTaskService(WorkTaskRepository taskRepository,
                           WorkTaskNoteRepository noteRepository) {
        this.taskRepository = taskRepository;
        this.noteRepository = noteRepository;
    }

    public List<WorkTaskDto> getTasks(UUID userId) {
        return taskRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public List<WorkTaskDto> getTasksByStatus(UUID userId, String status) {
        return taskRepository.findAllByUserIdAndStatus(userId, status)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public WorkTaskDto getTask(UUID userId, UUID id) {
        return WorkMapper.toDto(findOwnedTask(userId, id));
    }

    @Transactional
    public WorkTaskDto createTask(UUID userId, WorkTaskRequest req) {
        WorkTask task = new WorkTask();
        task.setUserId(userId);
        task.setTitle(req.title());
        task.setDescription(req.description());
        task.setType(req.type() != null ? req.type() : "OTHER");
        task.setClientName(req.clientName());
        task.setProgramId(req.programId());
        task.setStatus(req.status() != null ? req.status() : "todo");
        task.setDueDate(req.dueDate());

        return WorkMapper.toDto(taskRepository.save(task));
    }

    @Transactional
    public WorkTaskDto updateTask(UUID userId, UUID id, WorkTaskRequest req) {
        WorkTask task = findOwnedTask(userId, id);

        if (req.title() != null) task.setTitle(req.title());
        if (req.description() != null) task.setDescription(req.description());
        if (req.type() != null) task.setType(req.type());
        if (req.clientName() != null) task.setClientName(req.clientName());
        if (req.programId() != null) task.setProgramId(req.programId());
        if (req.status() != null) task.setStatus(req.status());
        if (req.dueDate() != null) task.setDueDate(req.dueDate());

        return WorkMapper.toDto(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID userId, UUID id) {
        taskRepository.delete(findOwnedTask(userId, id));
    }

    @Transactional
    public WorkTaskNoteDto addNote(UUID userId, UUID taskId, WorkTaskNoteRequest req) {
        findOwnedTask(userId, taskId);

        WorkTaskNote note = new WorkTaskNote();
        note.setTaskId(taskId);
        note.setUserId(userId);
        note.setContent(req.content());

        return WorkMapper.toDto(noteRepository.save(note));
    }

    public List<WorkTaskNoteDto> getNotes(UUID userId, UUID taskId) {
        findOwnedTask(userId, taskId);

        return noteRepository.findAllByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    private WorkTask findOwnedTask(UUID userId, UUID id) {
        return taskRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
    }
}
