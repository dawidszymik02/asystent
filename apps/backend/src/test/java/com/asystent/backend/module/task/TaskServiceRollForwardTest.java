package com.asystent.backend.module.task;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceRollForwardTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void rollForward_movesAllIncompletePastTasksToToday() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate twoDaysAgo = today.minusDays(2);

        Task t1 = taskWithDate(yesterday);
        Task t2 = taskWithDate(twoDaysAgo);

        when(taskRepository.findByCompletedFalseAndDateBefore(today)).thenReturn(List.of(t1, t2));
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        int count = taskService.rollForwardOverdueTasks();

        assertThat(count).isEqualTo(2);
        assertThat(t1.getDate()).isEqualTo(today);
        assertThat(t2.getDate()).isEqualTo(today);
    }

    @Test
    void rollForward_completedTasksAreNotReturnedByRepo_andNothingIsSaved() {
        LocalDate today = LocalDate.now();

        // Repository filters by completed=false, so completed tasks never reach the service
        when(taskRepository.findByCompletedFalseAndDateBefore(today)).thenReturn(Collections.emptyList());

        int count = taskService.rollForwardOverdueTasks();

        assertThat(count).isEqualTo(0);
        verify(taskRepository, never()).saveAll(anyList());
    }

    @Test
    void rollForward_doesNotModifyCompletedAtOrPosition() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        Task task = taskWithDate(yesterday);
        task.setPosition(3);
        task.setCompleted(false);
        task.setCompletedAt(null);

        when(taskRepository.findByCompletedFalseAndDateBefore(today)).thenReturn(List.of(task));
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        taskService.rollForwardOverdueTasks();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Task>> captor = ArgumentCaptor.forClass(List.class);
        verify(taskRepository).saveAll(captor.capture());
        Task saved = captor.getValue().get(0);

        assertThat(saved.getDate()).isEqualTo(today);
        assertThat(saved.getPosition()).isEqualTo(3);
        assertThat(saved.getCompletedAt()).isNull();
        assertThat(saved.isCompleted()).isFalse();
    }

    private Task taskWithDate(LocalDate date) {
        Task task = new Task();
        task.setDate(date);
        task.setCompleted(false);
        task.setTitle("test task");
        task.setPosition(0);
        return task;
    }
}
