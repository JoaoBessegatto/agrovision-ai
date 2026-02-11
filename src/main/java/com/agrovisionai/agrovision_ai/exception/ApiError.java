package com.agrovisionai.agrovision_ai.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public record ApiError(
        HttpStatus status,
        String message,
        LocalDateTime timestamp
) {}
