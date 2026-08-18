package com.billbeat;

import com.billbeat.entity.Bill;
import com.billbeat.entity.Customer;
import com.billbeat.entity.Vendor;
import com.billbeat.entity.WhatsAppMessage;
import com.billbeat.enums.MessageStatus;
import com.billbeat.enums.MessageType;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.WhatsAppMessageRepository;
import com.billbeat.service.WhatsAppMessageService;
import com.billbeat.whatsapp.WhatsAppProvider;
import com.billbeat.whatsapp.WhatsAppSendResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhatsAppMessageServiceTest {

    @Mock
    private WhatsAppMessageRepository whatsAppMessageRepository;
    @Mock
    private BillRepository billRepository;
    @Mock
    private WhatsAppProvider whatsAppProvider;

    @InjectMocks
    private WhatsAppMessageService whatsAppMessageService;

    private Vendor vendor;
    private Customer customer;
    private Bill bill;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(whatsAppMessageService, "maxRetries", 3);

        vendor = Vendor.builder().id(1L).businessName("Vendor 1").build();
        customer = Customer.builder().id(10L).name("Rahul").mobileNumber("9876543210").whatsAppEnabled(true).vendor(vendor).build();
        bill = Bill.builder()
                .id(50L)
                .vendor(vendor)
                .customer(customer)
                .billingPeriod("2026-08")
                .currentAmount(new BigDecimal("150.00"))
                .previousOutstanding(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("150.00"))
                .dueAmount(new BigDecimal("150.00"))
                .build();
    }

    @Test
    void testQueueBillNotification_Success() {
        when(whatsAppMessageRepository.existsByBillIdAndMessageType(50L, MessageType.BILL_NOTIFICATION)).thenReturn(false);
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage msg = i.getArgument(0);
            msg.setId(700L);
            return msg;
        });

        WhatsAppMessage result = whatsAppMessageService.queueBillNotification(bill);

        assertNotNull(result);
        assertEquals(MessageStatus.QUEUED, result.getStatus());
        assertEquals("9876543210", result.getPhoneNumber());
        verify(whatsAppMessageRepository, times(1)).save(any(WhatsAppMessage.class));
    }

    @Test
    void testSendSingleMessage_SuccessWithMockProvider() {
        WhatsAppMessage msg = WhatsAppMessage.builder()
                .id(700L)
                .bill(bill)
                .customer(customer)
                .vendor(vendor)
                .phoneNumber("9876543210")
                .messageType(MessageType.BILL_NOTIFICATION)
                .templateName("monthly_bill_notification")
                .status(MessageStatus.QUEUED)
                .attemptCount(0)
                .build();

        when(whatsAppProvider.sendTemplateMessage(eq("9876543210"), eq("monthly_bill_notification"), anyMap()))
                .thenReturn(WhatsAppSendResult.success("wamid.mock_12345"));

        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        WhatsAppSendResult result = whatsAppMessageService.sendSingleMessage(msg);

        assertTrue(result.isSuccess());
        assertEquals("wamid.mock_12345", result.getProviderMessageId());
        assertEquals(MessageStatus.SENT, msg.getStatus());
        assertEquals(1, msg.getAttemptCount());
    }
}
