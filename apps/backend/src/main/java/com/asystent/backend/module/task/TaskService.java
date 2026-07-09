package com.asystent.backend.module.task;

import com.asystent.backend.module.task.dto.CreateTaskRequest;
import com.asystent.backend.module.task.dto.TaskResponse;
import com.asystent.backend.module.task.dto.UpdateTaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<TaskResponse> getTasksForDate(UUID userId, LocalDate date) {
        List<Task> tasks = new ArrayList<>(
                taskRepository.findByUserIdAndDateOrderByCompletedAscPositionAsc(userId, date));

        // Fallback: if querying today, also surface past incomplete tasks in case scheduler missed a run
        if (date.equals(LocalDate.now())) {
            List<Task> overdue = taskRepository
                    .findByUserIdAndCompletedFalseAndDateBeforeOrderByDateAscPositionAsc(userId, date);
            tasks.addAll(overdue);
        }

        return tasks.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public TaskResponse createTask(UUID userId, CreateTaskRequest req) {
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(req.title());
        task.setDate(req.date());

        if (req.position() != null) {
            task.setPosition(req.position());
        } else {
            int maxPosition = taskRepository.findMaxPositionByUserIdAndDate(userId, req.date());
            task.setPosition(maxPosition + 1);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(UUID userId, UUID taskId, UpdateTaskRequest req) {
        Task task = findOwnedTask(userId, taskId);

        if (req.title() != null) task.setTitle(req.title());
        if (req.date() != null) task.setDate(req.date());
        if (req.position() != null) task.setPosition(req.position());

        if (req.completed() != null) {
            if (req.completed() && !task.isCompleted()) {
                task.setCompletedAt(OffsetDateTime.now());
            } else if (!req.completed()) {
                task.setCompletedAt(null);
            }
            task.setCompleted(req.completed());
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID userId, UUID taskId) {
        Task task = findOwnedTask(userId, taskId);
        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse toggleComplete(UUID userId, UUID taskId) {
        Task task = findOwnedTask(userId, taskId);
        boolean nowCompleted = !task.isCompleted();
        task.setCompleted(nowCompleted);
        task.setCompletedAt(nowCompleted ? OffsetDateTime.now() : null);
        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public int rollForwardOverdueTasks() {
        LocalDate today = LocalDate.now();
        List<Task> overdue = taskRepository.findByCompletedFalseAndDateBefore(today);
        overdue.forEach(t -> t.setDate(today));
        if (!overdue.isEmpty()) {
            taskRepository.saveAll(overdue);
        }
        return overdue.size();
    }

    private Task findOwnedTask(UUID userId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (!task.getUserId().equals(userId)) {
            throw new RuntimeException("Not found");
        }
        return task;
    }

    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getUserId(),
                task.getTitle(),
                task.getDate(),
                task.isCompleted(),
                task.getCompletedAt(),
                task.getPosition(),
                task.getCreatedAt()
        );
    }
}
