package com.asystent.backend.module.knowledge.controller;

import com.asystent.backend.common.ApiResponse;
import com.asystent.backend.module.knowledge.dto.AgentConversationResponse;
import com.asystent.backend.module.knowledge.dto.AgentMessageRequest;
import com.asystent.backend.module.knowledge.dto.AgentMessageResponse;
import com.asystent.backend.module.knowledge.service.AgentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agent")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AgentMessageResponse>> chat(
            Authentication auth,
            @Valid @RequestBody AgentMessageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(agentService.chat(getUserId(auth), request)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AgentConversationResponse>>> getConversations(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(agentService.getConversations(getUserId(auth))));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            Authentication auth,
            @PathVariable UUID id) {
        agentService.deleteConversation(getUserId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
