package com.billbeat.whatsapp;

import com.billbeat.dto.request.WhatsAppWebhookPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "billbeat.whatsapp.provider", havingValue = "MOCK", matchIfMissing = true)
public class MockWhatsAppProvider implements WhatsAppProvider {

    private static final Logger log = LoggerFactory.getLogger(MockWhatsAppProvider.class);

    @Value("${billbeat.whatsapp.verify-token:billbeat_webhook_verify_token}")
    private String verifyToken;

    @Override
    public WhatsAppSendResult sendTemplateMessage(String toPhone, String templateName, Map<String, String> parameters) {
        log.info("[MOCK WHATSAPP] Sending template '{}' to phone '{}' with parameters: {}", templateName, toPhone, parameters);
        String mockId = "wamid.mock_" + UUID.randomUUID().toString().replace("-", "");
        log.info("[MOCK WHATSAPP] Message sent successfully. Provider ID: {}", mockId);
        return WhatsAppSendResult.success(mockId);
    }

    @Override
    public WhatsAppSendResult sendDocumentMessage(String toPhone, String documentUrl, String filename, String caption) {
        log.info("[MOCK WHATSAPP] Sending document '{}' to phone '{}' from URL '{}'", filename, toPhone, documentUrl);
        String mockId = "wamid.mock_doc_" + UUID.randomUUID().toString().replace("-", "");
        return WhatsAppSendResult.success(mockId);
    }

    @Override
    public boolean verifyWebhook(String mode, String token, String challenge) {
        log.info("[MOCK WHATSAPP] Verifying webhook token mode: {}, token: {}", mode, token);
        return "subscribe".equals(mode) && verifyToken.equals(token);
    }

    @Override
    public void processWebhook(WhatsAppWebhookPayload payload) {
        log.info("[MOCK WHATSAPP] Received webhook payload: {}", payload);
    }
}
