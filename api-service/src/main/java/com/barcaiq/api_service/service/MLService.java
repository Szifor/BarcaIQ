package com.barcaiq.api_service.service;

import com.barcaiq.api_service.model.ChatRequest;
import com.barcaiq.api_service.model.PressRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLService {

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private final WebClient.Builder webClientBuilder;

    private WebClient client() {
        return webClientBuilder.baseUrl(mlServiceUrl).build();
    }

    public Map<?, ?> predictPress(PressRequest req) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("norm_x",                    req.getNormX());
            body.put("norm_y",                    req.getNormY());
            body.put("is_final_third",            req.getIsFinalThird());
            body.put("is_mid_third",              req.getIsMidThird());
            body.put("is_left_flank",             req.getIsLeftFlank());
            body.put("is_right_flank",            req.getIsRightFlank());
            body.put("minute",                    req.getMinute());
            body.put("is_first_half",             req.getIsFirstHalf());
            body.put("is_counterpress",           req.getIsCounterpress());
            body.put("teammates_pressing",        req.getTeammatePressing());
            body.put("press_index_in_possession", req.getPressIndexInPossession());

            return client().post()
                    .uri("/predict/press")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("FastAPI unavailable: {}", e.getMessage());
            return Map.of(
                "error"  , "ML service unavailable",
                "detail" , "Start FastAPI service on port 8000",
                "status" , "503"
            );
        }
    }

    public Map<?, ?> chat(ChatRequest req) {
        try {
            return client().post()
                    .uri("/chat")
                    .bodyValue(Map.of("question", req.getQuestion()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("FastAPI unavailable: {}", e.getMessage());
            return Map.of("error", "ML service unavailable", "status", "503");
        }
    }

    public Map<?, ?> getEraDna() {
        try {
            return client().get().uri("/stats/era-dna")
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            return Map.of("error", "ML service unavailable", "status", "503");
        }
    }

    public Map<?, ?> getPatterns() {
        try {
            return client().get().uri("/stats/patterns")
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            return Map.of("error", "ML service unavailable", "status", "503");
        }
    }

    public Map<?, ?> getSummary() {
        try {
            return client().get().uri("/stats/summary")
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            return Map.of("error", "ML service unavailable", "status", "503");
        }
    }

    public Map<?, ?> getHealth() {
        try {
            return client().get().uri("/health")
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            return Map.of("error", "ML service unavailable", "status", "503");
        }
    }
}