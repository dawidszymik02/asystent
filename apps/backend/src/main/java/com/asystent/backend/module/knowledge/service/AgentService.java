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
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
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

            Dzisiejsza data: %s

            ## Baza wiedzy (fragmenty dopasowane do pytania)
            %s

            ## Dane bieżące (szybki kontekst na dziś)

            ### Zadania na dziś
            %s

            ### Wydarzenia na dziś
            %s

            ### Otwarte zgłoszenia
            %s

            ### Zadania wdrożeniowe (Praca)
            %s

            Jeśli pytanie dotyczy innego okresu niż dziś (przeszłość, przyszłość,
            konkretny tydzień/miesiąc/rok), użyj dostępnych narzędzi
            get_calendar_events / get_daily_tasks / get_work_tasks z odpowiednim
            zakresem dat wyliczonym względem dzisiejszej daty.

            Odpowiadaj na podstawie powyższych danych. Jeśli informacja nie jest
            dostępna w kontekście, powiedz o tym wprost.
            """;

    private static final int MAX_TOOL_ITERATIONS = 5;

    private static final List<Map<String, Object>> TOOLS = List.of(
            tool("get_calendar_events",
                    "Zwraca wydarzenia z kalendarza w podanym zakresie dat (włącznie).",
                    dateRangeSchema(false)),
            tool("get_daily_tasks",
                    "Zwraca proste zadania dzienne (bez opisu) w podanym zakresie dat.",
                    dateRangeSchema(false)),
            tool("get_work_tasks",
                    "Zwraca zadania wdrożeniowe (z opisem, klientem, programem) w podanym zakresie dat due_date, "
                            + "opcjonalnie filtrowane po statusie.",
                    dateRangeSchema(true))
    );

    private static Map<String, Object> tool(String name, String description, Map<String, Object> inputSchema) {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("name", name);
        t.put("description", description);
        t.put("input_schema", inputSchema);
        return t;
    }

    private static Map<String, Object> dateRangeSchema(boolean withStatus) {
        Map<String, Object> fromDate = new LinkedHashMap<>();
        fromDate.put("type", "string");
        fromDate.put("description", "Data początkowa zakresu w formacie YYYY-MM-DD");

        Map<String, Object> toDate = new LinkedHashMap<>();
        toDate.put("type", "string");
        toDate.put("description", "Data końcowa zakresu w formacie YYYY-MM-DD");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("from_date", fromDate);
        properties.put("to_date", toDate);

        if (withStatus) {
            Map<String, Object> status = new LinkedHashMap<>();
            status.put("type", "string");
            status.put("enum", List.of("todo", "in_progress", "done", "cancelled"));
            status.put("description", "Opcjonalny filtr statusu zadania wdrożeniowego");
            properties.put("status", status);
        }

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of("from_date", "to_date"));
        return schema;
    }

    private final AgentConversationRepository conversationRepository;
    private final AgentMessageRepository messageRepository;
    private final SearchService searchService;
    private final LiveDataService liveDataService;
    private final String anthropicApiKey;
    private final String anthropicModel;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
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
        List<TicketSummary> openTickets = liveDataService.getOpenTickets(userId);
        List<WorkTaskSummary> openWorkTasks = liveDataService.getOpenWorkTasks(userId);
        log.info("Live data: {} task(s), {} event(s), {} ticket(s), {} work task(s)",
                todayTasks.size(), todayEvents.size(), openTickets.size(), openWorkTasks.size());

        String systemPrompt = buildSystemPrompt(fragments, todayTasks, todayEvents, openTickets, openWorkTasks);

        String assistantReply = callClaude(systemPrompt, history, req.message(), userId);

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
                LocalDate.now(),
                fragmentsText,
                tasksText(todayTasks, "Brak zadań na dziś"),
                eventsText(todayEvents, "Brak wydarzeń na dziś"),
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

    private String callClaude(String systemPrompt, List<AgentMessage> history, String userMessage, UUID userId) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (AgentMessage m : history) {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("role", m.getRole());
            msg.put("content", m.getContent());
            messages.add(msg);
        }
        Map<String, Object> currentMessage = new LinkedHashMap<>();
        currentMessage.put("role", "user");
        currentMessage.put("content", userMessage);
        messages.add(currentMessage);

        for (int iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
            JsonNode root = sendClaudeRequest(systemPrompt, messages);
            String stopReason = root.path("stop_reason").asText();
            JsonNode contentNode = root.get("content");

            if (!"tool_use".equals(stopReason)) {
                return extractText(contentNode);
            }

            Map<String, Object> assistantMessage = new LinkedHashMap<>();
            assistantMessage.put("role", "assistant");
            assistantMessage.put("content", contentNode);
            messages.add(assistantMessage);

            List<Map<String, Object>> toolResults = new ArrayList<>();
            for (JsonNode block : contentNode) {
                if (!"tool_use".equals(block.path("type").asText())) {
                    continue;
                }
                String toolUseId = block.get("id").asText();
                String toolName = block.get("name").asText();
                JsonNode input = block.get("input");
                log.info("Agent tool call: {} with input {}", toolName, input);

                Map<String, Object> toolResult = new LinkedHashMap<>();
                toolResult.put("type", "tool_result");
                toolResult.put("tool_use_id", toolUseId);
                toolResult.put("content", executeTool(userId, toolName, input));
                toolResults.add(toolResult);
            }

            Map<String, Object> toolResultMessage = new LinkedHashMap<>();
            toolResultMessage.put("role", "user");
            toolResultMessage.put("content", toolResults);
            messages.add(toolResultMessage);
        }

        log.warn("Agent tool-use loop exceeded {} iterations without a final answer", MAX_TOOL_ITERATIONS);
        return "Przepraszam, nie udało mi się dokończyć przetwarzania tego zapytania (zbyt wiele kroków). "
                + "Spróbuj doprecyzować zakres pytania.";
    }

    private JsonNode sendClaudeRequest(String systemPrompt, List<Map<String, Object>> messages) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", anthropicModel);
            body.put("max_tokens", 1024);
            body.put("system", systemPrompt);
            body.put("messages", messages);
            body.put("tools", TOOLS);

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

            return objectMapper.readTree(response.body());

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Claude API: " + e.getMessage(), e);
        }
    }

    private String extractText(JsonNode contentNode) {
        StringBuilder text = new StringBuilder();
        if (contentNode != null) {
            for (JsonNode block : contentNode) {
                if ("text".equals(block.path("type").asText())) {
                    text.append(block.path("text").asText());
                }
            }
        }
        return text.toString();
    }

    private String executeTool(UUID userId, String toolName, JsonNode input) {
        try {
            LocalDate fromDate = LocalDate.parse(input.get("from_date").asText());
            LocalDate toDate = LocalDate.parse(input.get("to_date").asText());

            Object results = switch (toolName) {
                case "get_calendar_events" -> liveDataService.getEventsForRange(userId, fromDate, toDate);
                case "get_daily_tasks" -> liveDataService.getTasksForRange(userId, fromDate, toDate);
                case "get_work_tasks" -> {
                    String status = input.hasNonNull("status") ? input.get("status").asText() : null;
                    yield liveDataService.getWorkTasksForRange(userId, fromDate, toDate, status);
                }
                default -> throw new IllegalArgumentException("Unknown tool: " + toolName);
            };

            List<?> resultList = (List<?>) results;
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("results", resultList);
            if (resultList.size() >= 200) {
                payload.put("truncated", true);
                payload.put("note", "Wynik przycięty do 200 rekordów, doprecyzuj zakres");
            }
            return objectMapper.writeValueAsString(payload);

        } catch (Exception e) {
            log.error("Tool execution failed for {}: {}", toolName, e.getMessage(), e);
            try {
                return objectMapper.writeValueAsString(
                        Map.of("error", "Nie udało się wykonać narzędzia: " + e.getMessage()));
            } catch (Exception jsonException) {
                return "{\"error\": \"Nie udało się wykonać narzędzia\"}";
            }
        }
    }
}
