package com.asystent.backend.module.work.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.work.WorkMapper;
import com.asystent.backend.module.work.dto.WorkTicketStatusDto;
import com.asystent.backend.module.work.dto.WorkTicketStatusRequest;
import com.asystent.backend.module.work.entity.WorkTicketStatus;
import com.asystent.backend.module.work.repository.WorkTicketStatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WorkTicketStatusService {

    private final WorkTicketStatusRepository statusRepository;

    public WorkTicketStatusService(WorkTicketStatusRepository statusRepository) {
        this.statusRepository = statusRepository;
    }

    public List<WorkTicketStatusDto> getStatuses(UUID userId) {
        return statusRepository.findAllByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public List<WorkTicketStatusDto> getAllStatuses(UUID userId) {
        return statusRepository.findAllByUserIdOrderBySortOrderAsc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    @Transactional
    public WorkTicketStatusDto createStatus(UUID userId, WorkTicketStatusRequest req) {
        WorkTicketStatus status = new WorkTicketStatus();
        status.setUserId(userId);
        status.setKey(req.key());
        status.setLabel(req.label());
        status.setColor(req.color() != null ? req.color() : "#6B7280");
        status.setBgColor(req.bgColor() != null ? req.bgColor() : "#F3F4F6");
        status.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        status.setIsActive(req.isActive() != null ? req.isActive() : true);
        return WorkMapper.toDto(statusRepository.save(status));
    }

    @Transactional
    public WorkTicketStatusDto updateStatus(UUID userId, UUID id, WorkTicketStatusRequest req) {
        WorkTicketStatus status = findOwned(userId, id);
        status.setKey(req.key());
        status.setLabel(req.label());
        if (req.color() != null) status.setColor(req.color());
        if (req.bgColor() != null) status.setBgColor(req.bgColor());
        if (req.sortOrder() != null) status.setSortOrder(req.sortOrder());
        if (req.isActive() != null) status.setIsActive(req.isActive());
        return WorkMapper.toDto(statusRepository.save(status));
    }

    @Transactional
    public void deleteStatus(UUID userId, UUID id) {
        statusRepository.delete(findOwned(userId, id));
    }

    private WorkTicketStatus findOwned(UUID userId, UUID id) {
        return statusRepository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Status not found: " + id));
    }
}
