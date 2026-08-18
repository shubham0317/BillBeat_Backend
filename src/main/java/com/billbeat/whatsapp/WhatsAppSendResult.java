package com.billbeat.whatsapp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppSendResult {

    private boolean success;
    private String providerMessageId;
    private String errorMessage;
    private boolean retryable;

    public static WhatsAppSendResult success(String providerMessageId) {
        return WhatsAppSendResult.builder()
                .success(true)
                .providerMessageId(providerMessageId)
                .build();
    }

    public static WhatsAppSendResult failure(String errorMessage, boolean retryable) {
        return WhatsAppSendResult.builder()
                .success(false)
                .errorMessage(errorMessage)
                .retryable(retryable)
                .build();
    }
}
