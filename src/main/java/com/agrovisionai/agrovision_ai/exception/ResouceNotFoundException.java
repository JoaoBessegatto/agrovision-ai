package com.agrovisionai.agrovision_ai.exception;

import org.springframework.http.HttpStatus;

public class ResouceNotFoundException extends BaseException {
    public ResouceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND,message);
    }
}
