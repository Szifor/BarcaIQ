package com.barcaiq.api_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> status() {
        return ResponseEntity.ok(Map.of(
            "status"  , "Auth module placeholder",
            "message" , "JWT auth documented in architecture, disabled for demo"
        ));
    }
}