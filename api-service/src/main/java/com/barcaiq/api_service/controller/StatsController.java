package com.barcaiq.api_service.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {

    // ── Health check ──────────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status"     , "ok",
            "service"    , "BarçaIQ API Service",
            "version"    , "1.0.0",
            "stack"      , Map.of(
                "java"        , "21",
                "springBoot"  , "3.5.11",
                "ml_service"  , "FastAPI (Python)",
                "cache"       , "Redis",
                "auth"        , "JWT"
            )
        ));
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("BarçaIQ Spring Boot is working!");
    }

    // ── System info ───────────────────────────────────────────────────────────
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
            "project"     , "BarçaIQ",
            "description" , "AI Tactical Intelligence System for FC Barcelona",
            "target"      , "Barça Innovation Hub",
            "modules"     , Map.of(
                "module2", "GNN Tactical DNA Classifier — AUC 0.782",
                "module3", "Press Trigger Detector — AUC 0.797",
                "module5", "LLM RAG Tactical Assistant — Llama 3.3 70B"
            ),
            "endpoints"   , Map.of(
                "auth"     , "POST /api/auth/login",
                "press"    , "POST /api/tactical/press",
                "chat"     , "POST /api/tactical/chat",
                "era_dna"  , "GET  /api/tactical/era-dna",
                "patterns" , "GET  /api/tactical/patterns",
                "summary"  , "GET  /api/tactical/summary"
            )
        ));
    }
}