package com.billbeat.dto.response;

import com.billbeat.enums.MessageStatus;
import com.billbeat.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppMessageResponse {

    private Long id;
    private Long billId;
    private Long customerId;
    private String customerName;
    private String phoneNumber;
    private MessageType messageType;
    private String providerMessageId;
    private String templateName;
    private MessageStatus status;
    private Integer attemptCount;
    private String lastError;
    private LocalDateTime queuedAt;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private LocalDateTime failedAt;
}
