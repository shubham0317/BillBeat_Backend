package com.billbeat.scheduler;

import com.billbeat.service.WhatsAppMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "billbeat.scheduler.whatsapp-queue.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class WhatsAppDeliveryScheduler {

    private final WhatsAppMessageService whatsAppMessageService;

    @Scheduled(fixedDelayString = "${billbeat.scheduler.whatsapp-queue.delay-ms:10000}")
    public void processOutboxQueue() {
        whatsAppMessageService.processQueuedMessages();
    }
}
