package com.asystent.backend.module.work.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.work.WorkMapper;
import com.asystent.backend.module.work.dto.WorkProgramDto;
import com.asystent.backend.module.work.dto.WorkProgramRequest;
import com.asystent.backend.module.work.entity.WorkProgram;
import com.asystent.backend.module.work.repository.WorkProgramRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class WorkProgramService {

    private final WorkProgramRepository programRepository;

    public WorkProgramService(WorkProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    public List<WorkProgramDto> getPrograms(UUID userId) {
        return programRepository.findAllByUserIdAndIsActiveTrueOrderByNameAsc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    public List<WorkProgramDto> getAllPrograms(UUID userId) {
        return programRepository.findAllByUserIdOrderByNameAsc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    @Transactional
    public WorkProgramDto createProgram(UUID userId, WorkProgramRequest req) {
        WorkProgram program = new WorkProgram();
        program.setUserId(userId);
        program.setName(req.name());
        program.setShortCode(req.shortCode());
        program.setColor(req.color() != null ? req.color() : "#6366F1");
        program.setDescription(req.description());
        program.setIsActive(req.isActive() != null ? req.isActive() : true);

        return WorkMapper.toDto(programRepository.save(program));
    }

    @Transactional
    public WorkProgramDto updateProgram(UUID userId, UUID id, WorkProgramRequest req) {
        WorkProgram program = programRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Program not found: " + id));

        if (req.name() != null) program.setName(req.name());
        if (req.shortCode() != null) program.setShortCode(req.shortCode());
        if (req.color() != null) program.setColor(req.color());
        if (req.description() != null) program.setDescription(req.description());
        if (req.isActive() != null) program.setIsActive(req.isActive());

        return WorkMapper.toDto(programRepository.save(program));
    }

    @Transactional
    public void deleteProgram(UUID userId, UUID id) {
        WorkProgram program = programRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Program not found: " + id));

        programRepository.delete(program);
    }
}
