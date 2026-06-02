package com.asystent.backend.module.work.service;

import com.asystent.backend.module.work.WorkMapper;
import com.asystent.backend.module.work.dto.WorkClientDto;
import com.asystent.backend.module.work.entity.WorkClient;
import com.asystent.backend.module.work.repository.WorkClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class WorkClientService {

    private final WorkClientRepository clientRepository;

    public WorkClientService(WorkClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public List<WorkClientDto> getClients(UUID userId) {
        return clientRepository.findAllByUserIdOrderByNameAsc(userId)
                .stream()
                .map(WorkMapper::toDto)
                .toList();
    }

    @Transactional
    public WorkClientDto findOrCreate(UUID userId, String name) {
        return clientRepository.findByUserIdAndNameIgnoreCase(userId, name)
                .map(WorkMapper::toDto)
                .orElseGet(() -> {
                    WorkClient client = new WorkClient();
                    client.setUserId(userId);
                    client.setName(name);
                    return WorkMapper.toDto(clientRepository.save(client));
                });
    }
}
