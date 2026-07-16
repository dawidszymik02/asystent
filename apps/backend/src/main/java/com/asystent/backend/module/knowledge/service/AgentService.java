package com.asystent.backend.module.knowledge.service;

import com.asystent.backend.exception.ResourceNotFoundException;
import com.asystent.backend.module.knowledge.dto.AgentConversationResponse;
import com.asystent.backend.module.knowledge.dto.AgentMessageRequest;
import com.asystent.backend.module.knowledge.dto.AgentMessageResponse;
import com.asystent.backend.module.knowledge.dto.EventSummary;
import com.asystent.backend.module.knowledge.dto.SearchRequest;
import com.asystent.backend.module.knowledge.dto.SearchResponse;
import com.asystent.backend.module.knowledge.dto.SearchResultItem;
import com.asystent.backend.module.knowledge.dto.TaskSummary;
import com.asystent.backend.module.knowledge.dto.TicketSummary;
import com.asystent.backend.module.knowledge.dto.WorkTaskSummary;
import com.asystent.backend.module.knowledge.entity.AgentConversation;
import com.asystent.backend.module.knowledge.entity.AgentMessage;
import com.asystent.backend.module.knowledge.repository.AgentConversationRepository;
import com.asystent.backend.module.knowledge.repository.AgentMessageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AgentService {

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            Jesteś osobistym asystentem AI. Pomagasz użytkownikowi w pracy i organizacji.
            Odpowiadaj po polsku, zwięźle i konkretnie.

            Rozróżniaj dziś/jutro/wczoraj na podstawie nagłówków sekcji — nie myl ich ze sobą.

            ## Baza wiedzy (fragmenty dopasowane do pytania)
            %s

            ## Dane bieżące

            ### Zadania na dziś
            %s

            ### Wydarzenia na dziś
            %s

            ### Zadania jutro
            %s

            ### Wydarzenia jutro
            %s

            ### Zadania wczoraj
            %s

            ### Wydarzenia wczoraj
            %s

            ### Otwarte zgłoszenia
            %s

            ### Zadania wdrożeniowe (Praca)
            %s

            Odpowiadaj na podstawie powyższych danych. Jeśli informacja nie jest
            dostępna w kontekście, powiedz o tym wprost.
            """;

    private final AgentConversationRepository conversationRepository;
    private final AgentMessageRepository messageRepository;
    private final SearchService searchService;
    private final LiveDataService liveDataService;
    private final String anthropicApiKey;
    private final String anthropicModel;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AgentService(
            AgentConversationRepository conversationRepository,
            AgentMessageRepository messageRepository,
            SearchService searchService,
            LiveDataService liveDataService,
            @Value("${anthropic.api.key}") String anthropicApiKey,
            @Value("${anthropic.model:claude-haiku-4-5-20251001}") String anthropicModel) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.searchService = searchService;
        this.liveDataService = liveDataService;
        this.anthropicApiKey = anthropicApiKey;
        this.anthropicModel = anthropicModel;
    }

    @Transactional
    public AgentMessageResponse chat(UUID userId, AgentMessageRequest req) {
        log.info("Agent chat for user {}: conversationId={}", userId, req.conversationId());

        AgentConversation conversation = getOrCreateConversation(userId, req);

        List<AgentMessage> history = messageRepository
                .findTop10ByConversationIdOrderByCreatedAtDesc(conversation.getId());
        Collections.reverse(history);
        log.info("Loaded {} history message(s) for conversation {}", history.size(), conversation.getId());

        SearchResponse ragResponse = searchService.search(userId, new SearchRequest(req.message(), List.of(), 5));
        List<String> fragments = ragResponse.results().stream().map(SearchResultItem::content).toList();
        List<String> sourcesUsed = ragResponse.results().stream()
                .map(SearchResultItem::documentTitle)
                .distinct()
                .toList();
        log.info("RAG search returned {} fragment(s), {} source(s)", fragments.size(), sourcesUsed.size());

        List<TaskSummary> todayTasks = liveDataService.getTodayTasks(userId);
        List<EventSummary> todayEvents = liveDataService.getTodayEvents(userId);
        List<TaskSummary> tomorrowTasks = liveDataService.getTomorrowTasks(userId);
        List<EventSummary> tomorrowEvents = liveDataService.getTomorrowEvents(userId);
        List<TaskSummary> yesterdayTasks = liveDataService.getYesterdayTasks(userId);
        List<EventSummary> yesterdayEvents = liveDataService.getYesterdayEvents(userId);
        List<TicketSummary> openTickets = liveDataService.getOpenTickets(userId);
        List<WorkTaskSummary> openWorkTasks = liveDataService.getOpenWorkTasks(userId);
        log.info("Live data: {} task(s), {} event(s), {} ticket(s), {} work task(s)",
                todayTasks.size(), todayEvents.size(), openTickets.size(), openWorkTasks.size());

        String systemPrompt = buildSystemPrompt(
                fragments, todayTasks, todayEvents,
                tomorrowTasks, tomorrowEvents,
                yesterdayTasks, yesterdayEvents,
                openTickets, openWorkTasks);

        String assistantReply = callClaude(systemPrompt, history, req.message());

        saveMessage(conversation, userId, "user", req.message());
        saveMessage(conversation, userId, "assistant", assistantReply);

        return new AgentMessageResponse(assistantReply, conversation.getId(), sourcesUsed);
    }

    @Transactional(readOnly = true)
    public List<AgentConversationResponse> getConversations(UUID userId) {
        return conversationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(c -> new AgentConversationResponse(c.getId(), c.getTitle(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void deleteConversation(UUID userId, UUID conversationId) {
        AgentConversation conversation = conversationRepository.findById(conversationId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        conversationRepository.delete(conversation);
        log.info("Deleted conversation {} for user {}", conversationId, userId);
    }

    private AgentConversation getOrCreateConversation(UUID userId, AgentMessageRequest req) {
        if (req.conversationId() == null) {
            AgentConversation conversation = new AgentConversation();
            conversation.setUserId(userId);
            conversation.setTitle(req.message().substring(0, Math.min(50, req.message().length())));
            conversationRepository.save(conversation);
            log.info("Created new conversation {} for user {}", conversation.getId(), userId);
            return conversation;
        }

        return conversationRepository.findById(req.conversationId())
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + req.conversationId()));
    }

    private void saveMessage(AgentConversation conversation, UUID userId, String role, String content) {
        AgentMessage message = new AgentMessage();
        message.setConversationId(conversation.getId());
        message.setUserId(userId);
        message.setRole(role);
        message.setContent(content);
        messageRepository.save(message);
    }

    private String buildSystemPrompt(
            List<String> fragments,
            List<TaskSummary> todayTasks,
            List<EventSummary> todayEvents,
            List<TaskSummary> tomorrowTasks,
            List<EventSummary> tomorrowEvents,
            List<TaskSummary> yesterdayTasks,
            List<EventSummary> yesterdayEvents,
            List<TicketSummary> openTickets,
            List<WorkTaskSummary> openWorkTasks) {

        String fragmentsText = fragments.isEmpty()
                ? "Brak dopasowanych dokumentów"
                : String.join("\n---\n", fragments);

        String ticketsText = openTickets.isEmpty()
                ? "Brak otwartych zgłoszeń"
                : openTickets.stream()
                    .map(t -> "- " + t.title() + " (" + t.statusName() + ")")
                    .collect(Collectors.joining("\n"));

        return SYSTEM_PROMPT_TEMPLATE.formatted(
                fragmentsText,
                tasksText(todayTasks, "Brak zadań na dziś"),
                eventsText(todayEvents, "Brak wydarzeń na dziś"),
                tasksText(tomorrowTasks, "Brak zadań na jutro"),
                eventsText(tomorrowEvents, "Brak wydarzeń na jutro"),
                tasksText(yesterdayTasks, "Brak zadań na wczoraj"),
                eventsText(yesterdayEvents, "Brak wydarzeń na wczoraj"),
                ticketsText,
                workTasksText(openWorkTasks));
    }

    private String workTasksText(List<WorkTaskSummary> workTasks) {
        return workTasks.isEmpty()
                ? "Brak otwartych zadań wdrożeniowych"
                : workTasks.stream().map(t -> {
                    String base = "- " + t.title() + " (klient: " + t.clientName() + ", status: " + t.status() + ")";
                    return t.description() == null ? base : base + ": " + t.description();
                }).collect(Collectors.joining("\n"));
    }

    private String tasksText(List<TaskSummary> tasks, String emptyText) {
        return tasks.isEmpty()
                ? emptyText
                : tasks.stream().map(t -> "- " + t.title()).collect(Collectors.joining("\n"));
    }

    private String eventsText(List<EventSummary> events, String emptyText) {
        return events.isEmpty()
                ? emptyText
                : events.stream()
                    .map(e -> "- " + e.startTime() + " " + e.title())
                    .collect(Collectors.joining("\n"));
    }

    private String callClaude(String systemPrompt, List<AgentMessage> history, String userMessage) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            for (AgentMessage m : history) {
                Map<String, String> msg = new LinkedHashMap<>();
                msg.put("role", m.getRole());
                msg.put("content", m.getContent());
                messages.add(msg);
            }
            Map<String, String> currentMessage = new LinkedHashMap<>();
            currentMessage.put("role", "user");
            currentMessage.put("content", userMessage);
            messages.add(currentMessage);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", anthropicModel);
            body.put("max_tokens", 1024);
            body.put("system", systemPrompt);
            body.put("messages", messages);

            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(CLAUDE_API_URL))
                    .header("x-api-key", anthropicApiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Claude API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Claude API returned status " + response.statusCode() + ": " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            return root.get("content").get(0).get("text").asText();

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Claude API: " + e.getMessage(), e);
        }
    }
}
