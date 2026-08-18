package com.billbeat.whatsapp;

import com.billbeat.dto.request.WhatsAppWebhookPayload;
import com.billbeat.util.PhoneUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@ConditionalOnProperty(name = "billbeat.whatsapp.provider", havingValue = "META_CLOUD_API")
public class MetaWhatsAppCloudApiProvider implements WhatsAppProvider {

    private static final Logger log = LoggerFactory.getLogger(MetaWhatsAppCloudApiProvider.class);

    @Value("${billbeat.whatsapp.access-token}")
    private String accessToken;

    @Value("${billbeat.whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${billbeat.whatsapp.verify-token}")
    private String verifyToken;

    @Value("${billbeat.whatsapp.api-base-url:https://graph.facebook.com/v19.0}")
    private String apiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public WhatsAppSendResult sendTemplateMessage(String toPhone, String templateName, Map<String, String> parameters) {
        String formattedPhone = PhoneUtils.formatWhatsAppPhone(toPhone);
        String url = String.format("%s/%s/messages", apiBaseUrl, phoneNumberId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        List<Map<String, Object>> components = new ArrayList<>();
        if (parameters != null && !parameters.isEmpty()) {
            List<Map<String, String>> bodyParams = new ArrayList<>();
            for (Map.Entry<String, String> entry : parameters.entrySet()) {
                Map<String, String> param = new HashMap<>();
                param.put("type", "text");
                param.put("text", entry.getValue());
                bodyParams.add(param);
            }
            Map<String, Object> bodyComponent = new HashMap<>();
            bodyComponent.put("type", "body");
            bodyComponent.put("parameters", bodyParams);
            components.add(bodyComponent);
        }

        Map<String, Object> template = new HashMap<>();
        template.put("name", templateName);
        template.put("language", Map.of("code", "en_US"));
        if (!components.isEmpty()) {
            template.put("components", components);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", formattedPhone);
        body.put("type", "template");
        body.put("template", template);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> messages = (List<Map<String, Object>>) response.getBody().get("messages");
                if (messages != null && !messages.isEmpty()) {
                    Map<String, Object> firstMsg = messages.get(0);
                    String providerMsgId = (String) firstMsg.get("id");
                    log.info("Meta WhatsApp Cloud API message sent successfully. Provider ID: {}", providerMsgId);
                    return WhatsAppSendResult.success(providerMsgId);
                }
            }
            return WhatsAppSendResult.failure("Unexpected response from Meta API", true);
        } catch (Exception ex) {
            log.error("Failed to send Meta WhatsApp Cloud API template message: {}", ex.getMessage());
            return WhatsAppSendResult.failure(ex.getMessage(), true);
        }
    }

    @Override
    public WhatsAppSendResult sendDocumentMessage(String toPhone, String documentUrl, String filename, String caption) {
        String formattedPhone = PhoneUtils.formatWhatsAppPhone(toPhone);
        String url = String.format("%s/%s/messages", apiBaseUrl, phoneNumberId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> document = new HashMap<>();
        document.put("link", documentUrl);
        document.put("filename", filename);
        if (caption != null) {
            document.put("caption", caption);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", formattedPhone);
        body.put("type", "document");
        body.put("document", document);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> messages = (List<Map<String, Object>>) response.getBody().get("messages");
                if (messages != null && !messages.isEmpty()) {
                    Map<String, Object> firstMsg = messages.get(0);
                    String providerMsgId = (String) firstMsg.get("id");
                    return WhatsAppSendResult.success(providerMsgId);
                }
            }
            return WhatsAppSendResult.failure("Unexpected response from Meta API", true);
        } catch (Exception ex) {
            log.error("Failed to send Meta WhatsApp Cloud API document message: {}", ex.getMessage());
            return WhatsAppSendResult.failure(ex.getMessage(), true);
        }
    }

    @Override
    public boolean verifyWebhook(String mode, String token, String challenge) {
        return "subscribe".equals(mode) && verifyToken.equals(token);
    }

    @Override
    public void processWebhook(WhatsAppWebhookPayload payload) {
        log.info("Received Meta WhatsApp Cloud API Webhook: {}", payload);
    }
}
