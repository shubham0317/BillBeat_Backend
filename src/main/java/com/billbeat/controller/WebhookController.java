package com.billbeat.controller;

import com.billbeat.dto.request.WhatsAppWebhookPayload;
import com.billbeat.service.WhatsAppMessageService;
import com.billbeat.whatsapp.WhatsAppProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Endpoints for receiving status webhooks from Meta / WhatsApp Business API providers")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final WhatsAppProvider whatsAppProvider;
    private final WhatsAppMessageService whatsAppMessageService;

    @GetMapping
    @Operation(summary = "Verify Webhook", description = "Endpoint called by Meta to verify webhook challenge setup")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String token,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        log.info("Webhook verification request: mode={}, token={}", mode, token);
        boolean verified = whatsAppProvider.verifyWebhook(mode, token, challenge);
        if (verified) {
            log.info("Webhook verification challenge successful");
            return ResponseEntity.ok(challenge);
        } else {
            log.warn("Webhook verification challenge failed");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping
    @Operation(summary = "Process Webhook Event", description = "Receives asynchronous delivery, read, or failure status events from WhatsApp provider")
    public ResponseEntity<Void> handleWebhookEvent(@RequestBody WhatsAppWebhookPayload payload) {
        log.info("Received WhatsApp Webhook payload: {}", payload);
        whatsAppProvider.processWebhook(payload);

        if (payload != null && payload.getEntry() != null) {
            for (WhatsAppWebhookPayload.Entry entry : payload.getEntry()) {
                if (entry.getChanges() != null) {
                    for (WhatsAppWebhookPayload.Change change : entry.getChanges()) {
                        if (change.getValue() != null && change.getValue().getStatuses() != null) {
                            for (WhatsAppWebhookPayload.Status status : change.getValue().getStatuses()) {
                                String providerMsgId = status.getId();
                                String msgStatus = status.getStatus();
                                String errorDetail = (status.getErrors() != null && !status.getErrors().isEmpty())
                                        ? status.getErrors().get(0).getMessage() : null;

                                whatsAppMessageService.updateMessageStatusFromWebhook(providerMsgId, msgStatus, errorDetail);
                            }
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok().build();
    }
}
