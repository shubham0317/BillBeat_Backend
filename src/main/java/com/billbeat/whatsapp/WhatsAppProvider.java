package com.billbeat.whatsapp;

import com.billbeat.dto.request.WhatsAppWebhookPayload;

import java.util.Map;

public interface WhatsAppProvider {

    WhatsAppSendResult sendTemplateMessage(String toPhone, String templateName, Map<String, String> parameters);

    WhatsAppSendResult sendDocumentMessage(String toPhone, String documentUrl, String filename, String caption);

    boolean verifyWebhook(String mode, String token, String challenge);

    void processWebhook(WhatsAppWebhookPayload payload);
}
