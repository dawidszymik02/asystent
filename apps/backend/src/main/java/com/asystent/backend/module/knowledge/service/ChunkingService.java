package com.asystent.backend.module.knowledge.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ChunkingService {

    // ~500 tokens (1 token ≈ 4 chars)
    private static final int CHUNK_SIZE = 2000;
    private static final int OVERLAP = 200;

    public List<String> chunkText(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        List<String> chunks = new ArrayList<>();
        int start = 0;

        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());

            // Avoid splitting in the middle of a word
            if (end < text.length()) {
                int spaceIndex = text.lastIndexOf(' ', end);
                if (spaceIndex > start) {
                    end = spaceIndex;
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }

            if (end >= text.length()) {
                break;
            }

            int newStart = end - OVERLAP;
            // Guarantee forward progress regardless of overlap calculation
            start = (newStart > start) ? newStart : end;
        }

        log.debug("Chunked {} chars into {} chunks (size={}, overlap={})",
                text.length(), chunks.size(), CHUNK_SIZE, OVERLAP);
        return chunks;
    }
}
