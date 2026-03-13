package com.barcaiq.api_service.model;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}