package com.asystent.backend.module.knowledge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmbeddingService {

    private static final int BATCH_SIZE = 100;
    private static final String OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
    private static final String EMBEDDING_MODEL = "text-embedding-3-small";

    private final String openAiApiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public EmbeddingService(@Value("${openai.api.key}") String openAiApiKey) {
        this.openAiApiKey = openAiApiKey;
    }

    public List<float[]> generateEmbeddings(List<String> texts) {
        log.info("Generating embeddings for {} texts", texts.size());
        List<float[]> result = new ArrayList<>();

        for (int i = 0; i < texts.size(); i += BATCH_SIZE) {
            List<String> batch = texts.subList(i, Math.min(i + BATCH_SIZE, texts.size()));
            log.info("Processing embedding batch {}/{}", (i / BATCH_SIZE) + 1, (texts.size() + BATCH_SIZE - 1) / BATCH_SIZE);
            result.addAll(callOpenAiEmbeddings(batch));
        }

        log.info("Generated total {} embeddings", result.size());
        return result;
    }

    private List<float[]> callOpenAiEmbeddings(List<String> texts) {
        try {
            String requestJson = objectMapper.writeValueAsString(Map.of(
                    "model", EMBEDDING_MODEL,
                    "input", texts
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENAI_EMBEDDINGS_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("OpenAI API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("OpenAI embeddings API returned status " + response.statusCode() + ": " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode data = root.get("data");

            List<float[]> embeddings = new ArrayList<>();
            for (JsonNode item : data) {
                JsonNode embNode = item.get("embedding");
                float[] emb = new float[embNode.size()];
                for (int i = 0; i < embNode.size(); i++) {
                    emb[i] = (float) embNode.get(i).asDouble();
                }
                embeddings.add(emb);
            }

            log.info("Received {} embeddings from OpenAI", embeddings.size());
            return embeddings;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call OpenAI embeddings API: " + e.getMessage(), e);
        }
    }
}
