package com.barcaiq.api_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class ApiServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiServiceApplication.class, args);
    }
}