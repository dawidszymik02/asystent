package com.asystent.backend.module.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskRolloverScheduler {

    private final TaskService taskService;

    // Runs daily at 00:05 server time
    @Scheduled(cron = "0 5 0 * * *")
    public void rollForwardOverdueTasks() {
        int count = taskService.rollForwardOverdueTasks();
        log.info("Task roll-forward: moved {} overdue incomplete task(s) to today", count);
    }
}
