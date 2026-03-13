package com.barcaiq.api_service.controller;

import com.barcaiq.api_service.model.ChatRequest;
import com.barcaiq.api_service.model.PressRequest;
import com.barcaiq.api_service.service.MLService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tactical")
@RequiredArgsConstructor
public class TacticalController {

    private final MLService mlService;

    // ── Press prediction ──────────────────────────────────────────────────────
    @PostMapping("/press")
    public ResponseEntity<Map<?, ?>> predictPress(
            @RequestBody PressRequest req) {
        log.debug("POST /api/tactical/press");
        return ResponseEntity.ok(mlService.predictPress(req));
    }

    // ── RAG chat ──────────────────────────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<Map<?, ?>> chat(
            @RequestBody ChatRequest req) {
        log.debug("POST /api/tactical/chat : {}", req.getQuestion());
        return ResponseEntity.ok(mlService.chat(req));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    @GetMapping("/era-dna")
    public ResponseEntity<Map<?, ?>> getEraDna() {
        return ResponseEntity.ok(mlService.getEraDna());
    }

    @GetMapping("/patterns")
    public ResponseEntity<Map<?, ?>> getPatterns() {
        return ResponseEntity.ok(mlService.getPatterns());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<?, ?>> getSummary() {
        return ResponseEntity.ok(mlService.getSummary());
    }
}