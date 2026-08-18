package com.billbeat.service;

import com.billbeat.dto.response.WhatsAppMessageResponse;
import com.billbeat.entity.Bill;
import com.billbeat.entity.Customer;
import com.billbeat.entity.Vendor;
import com.billbeat.entity.WhatsAppMessage;
import com.billbeat.enums.MessageStatus;
import com.billbeat.enums.MessageType;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.exception.WhatsAppException;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.WhatsAppMessageRepository;
import com.billbeat.util.SecurityUtils;
import com.billbeat.whatsapp.WhatsAppProvider;
import com.billbeat.whatsapp.WhatsAppSendResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WhatsAppMessageService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppMessageService.class);

    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final BillRepository billRepository;
    private final WhatsAppProvider whatsAppProvider;

    @Value("${billbeat.scheduler.whatsapp-queue.max-retries:3}")
    private int maxRetries;

    @Transactional
    public WhatsAppMessage queueBillNotification(Bill bill) {
        Customer customer = bill.getCustomer();
        Vendor vendor = bill.getVendor();

        if (!customer.isWhatsAppEnabled()) {
            log.info("WhatsApp notifications disabled for customer ID: {}", customer.getId());
            return null;
        }

        if (whatsAppMessageRepository.existsByBillIdAndMessageType(bill.getId(), MessageType.BILL_NOTIFICATION)) {
            log.info("WhatsApp message already queued or sent for bill ID: {}", bill.getId());
            return whatsAppMessageRepository.findByBillIdAndMessageType(bill.getId(), MessageType.BILL_NOTIFICATION).orElse(null);
        }

        WhatsAppMessage message = WhatsAppMessage.builder()
                .bill(bill)
                .customer(customer)
                .vendor(vendor)
                .phoneNumber(customer.getMobileNumber())
                .messageType(MessageType.BILL_NOTIFICATION)
                .templateName("monthly_bill_notification")
                .status(MessageStatus.QUEUED)
                .attemptCount(0)
                .queuedAt(LocalDateTime.now())
                .build();

        return whatsAppMessageRepository.save(message);
    }

    @Transactional
    public void processQueuedMessages() {
        List<MessageStatus> targetStatuses = List.of(MessageStatus.QUEUED, MessageStatus.RETRY_PENDING);
        List<WhatsAppMessage> messages = whatsAppMessageRepository.findByStatusInAndAttemptCountLessThan(targetStatuses, maxRetries);

        for (WhatsAppMessage message : messages) {
            try {
                sendSingleMessage(message);
            } catch (Exception ex) {
                log.error("Failed to process WhatsApp message ID {}: {}", message.getId(), ex.getMessage());
            }
        }
    }

    @Transactional
    public WhatsAppSendResult sendSingleMessage(WhatsAppMessage message) {
        message.setStatus(MessageStatus.SENDING);
        message.setAttemptCount(message.getAttemptCount() + 1);
        whatsAppMessageRepository.save(message);

        Bill bill = message.getBill();
        Map<String, String> parameters = new HashMap<>();
        parameters.put("customer_name", bill.getCustomer().getName());
        parameters.put("billing_period", bill.getBillingPeriod());
        parameters.put("current_amount", bill.getCurrentAmount().toPlainString());
        parameters.put("previous_outstanding", bill.getPreviousOutstanding().toPlainString());
        parameters.put("total_amount", bill.getTotalAmount().toPlainString());
        parameters.put("due_amount", bill.getDueAmount().toPlainString());

        WhatsAppSendResult result = whatsAppProvider.sendTemplateMessage(
                message.getPhoneNumber(),
                message.getTemplateName(),
                parameters
        );

        if (result.isSuccess()) {
            message.setStatus(MessageStatus.SENT);
            message.setProviderMessageId(result.getProviderMessageId());
            message.setSentAt(LocalDateTime.now());
            message.setLastError(null);
        } else {
            message.setLastError(result.getErrorMessage());
            if (result.isRetryable() && message.getAttemptCount() < maxRetries) {
                message.setStatus(MessageStatus.RETRY_PENDING);
            } else {
                message.setStatus(MessageStatus.FAILED);
                message.setFailedAt(LocalDateTime.now());
            }
        }

        whatsAppMessageRepository.save(message);
        return result;
    }

    @Transactional
    public WhatsAppMessageResponse resendBillWhatsApp(Long billId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Bill bill = billRepository.findByIdAndVendorId(billId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + billId));

        if (!bill.getCustomer().isWhatsAppEnabled()) {
            throw new WhatsAppException("Customer has WhatsApp notifications disabled");
        }

        WhatsAppMessage message = whatsAppMessageRepository.findByBillIdAndMessageType(bill.getId(), MessageType.BILL_NOTIFICATION)
                .orElse(null);

        if (message == null) {
            message = queueBillNotification(bill);
        } else {
            if (message.getStatus() == MessageStatus.SENT || message.getStatus() == MessageStatus.DELIVERED || message.getStatus() == MessageStatus.READ) {
                log.warn("Resending bill notification that was already in status: {}", message.getStatus());
            }
            message.setStatus(MessageStatus.QUEUED);
            message.setAttemptCount(0);
            message.setQueuedAt(LocalDateTime.now());
            message = whatsAppMessageRepository.save(message);
        }

        sendSingleMessage(message);
        return mapToResponse(message);
    }

    public WhatsAppMessageResponse getWhatsAppStatusByBillId(Long billId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Bill bill = billRepository.findByIdAndVendorId(billId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + billId));

        WhatsAppMessage message = whatsAppMessageRepository.findByBillIdAndMessageType(bill.getId(), MessageType.BILL_NOTIFICATION)
                .orElseThrow(() -> new ResourceNotFoundException("No WhatsApp message history found for bill ID: " + billId));

        return mapToResponse(message);
    }

    @Transactional
    public void updateMessageStatusFromWebhook(String providerMessageId, String newStatus, String error) {
        WhatsAppMessage message = whatsAppMessageRepository.findByProviderMessageId(providerMessageId)
                .orElse(null);

        if (message == null) {
            log.warn("Webhook received for unknown providerMessageId: {}", providerMessageId);
            return;
        }

        switch (newStatus.toLowerCase()) {
            case "sent" -> {
                message.setStatus(MessageStatus.SENT);
                if (message.getSentAt() == null) message.setSentAt(LocalDateTime.now());
            }
            case "delivered" -> {
                message.setStatus(MessageStatus.DELIVERED);
                if (message.getDeliveredAt() == null) message.setDeliveredAt(LocalDateTime.now());
            }
            case "read" -> {
                message.setStatus(MessageStatus.READ);
                if (message.getReadAt() == null) message.setReadAt(LocalDateTime.now());
            }
            case "failed" -> {
                message.setStatus(MessageStatus.FAILED);
                message.setFailedAt(LocalDateTime.now());
                if (error != null) message.setLastError(error);
            }
        }

        whatsAppMessageRepository.save(message);
        log.info("Updated WhatsApp message ID {} status to {}", message.getId(), message.getStatus());
    }

    private WhatsAppMessageResponse mapToResponse(WhatsAppMessage msg) {
        return WhatsAppMessageResponse.builder()
                .id(msg.getId())
                .billId(msg.getBill().getId())
                .customerId(msg.getCustomer().getId())
                .customerName(msg.getCustomer().getName())
                .phoneNumber(msg.getPhoneNumber())
                .messageType(msg.getMessageType())
                .providerMessageId(msg.getProviderMessageId())
                .templateName(msg.getTemplateName())
                .status(msg.getStatus())
                .attemptCount(msg.getAttemptCount())
                .lastError(msg.getLastError())
                .queuedAt(msg.getQueuedAt())
                .sentAt(msg.getSentAt())
                .deliveredAt(msg.getDeliveredAt())
                .readAt(msg.getReadAt())
                .failedAt(msg.getFailedAt())
                .build();
    }
}
