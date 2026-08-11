package com.agrovisionai.agrovision_ai.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {
    public BusinessException(String message) {
        super(HttpStatus.BAD_REQUEST,message);
    }
}
