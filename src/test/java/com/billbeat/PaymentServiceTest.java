package com.billbeat;

import com.billbeat.dto.request.PaymentRequest;
import com.billbeat.dto.response.PaymentResponse;
import com.billbeat.entity.Bill;
import com.billbeat.entity.Customer;
import com.billbeat.entity.Payment;
import com.billbeat.entity.Vendor;
import com.billbeat.enums.BillStatus;
import com.billbeat.enums.PaymentMethod;
import com.billbeat.exception.PaymentException;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.PaymentRepository;
import com.billbeat.security.UserPrincipal;
import com.billbeat.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private BillRepository billRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Vendor vendor;
    private Customer customer;
    private Bill bill;

    @BeforeEach
    void setUp() {
        vendor = Vendor.builder().id(1L).businessName("Test Vendor").build();
        customer = Customer.builder().id(10L).name("Amit Kumar").vendor(vendor).build();

        bill = Bill.builder()
                .id(100L)
                .vendor(vendor)
                .customer(customer)
                .billingPeriod("2026-08")
                .currentAmount(new BigDecimal("200.00"))
                .previousOutstanding(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("200.00"))
                .paidAmount(BigDecimal.ZERO)
                .dueAmount(new BigDecimal("200.00"))
                .status(BillStatus.UNPAID)
                .build();

        UserPrincipal principal = UserPrincipal.builder()
                .id(100L)
                .username("vendor1")
                .vendorId(1L)
                .authorities(Collections.emptyList())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
    }

    @Test
    void testRecordPayment_PartialPayment() {
        PaymentRequest request = new PaymentRequest();
        request.setBillId(100L);
        request.setAmount(new BigDecimal("100.00"));
        request.setPaymentMethod(PaymentMethod.UPI);

        when(billRepository.findByIdAndVendorId(100L, 1L)).thenReturn(Optional.of(bill));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(500L);
            return p;
        });

        PaymentResponse response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("100.00"), response.getAmount());
        assertEquals(new BigDecimal("100.00"), response.getRemainingBillDueAmount());
        assertEquals(BillStatus.PARTIALLY_PAID, bill.getStatus());
    }

    @Test
    void testRecordPayment_FullPayment() {
        PaymentRequest request = new PaymentRequest();
        request.setBillId(100L);
        request.setAmount(new BigDecimal("200.00"));
        request.setPaymentMethod(PaymentMethod.CASH);

        when(billRepository.findByIdAndVendorId(100L, 1L)).thenReturn(Optional.of(bill));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(501L);
            return p;
        });

        PaymentResponse response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals(0, response.getRemainingBillDueAmount().compareTo(BigDecimal.ZERO));
        assertEquals(BillStatus.PAID, bill.getStatus());
    }

    @Test
    void testRecordPayment_ExceedingDueAmount_ThrowsException() {
        PaymentRequest request = new PaymentRequest();
        request.setBillId(100L);
        request.setAmount(new BigDecimal("300.00"));
        request.setPaymentMethod(PaymentMethod.CASH);

        when(billRepository.findByIdAndVendorId(100L, 1L)).thenReturn(Optional.of(bill));

        assertThrows(PaymentException.class, () -> paymentService.recordPayment(request));
    }
}
