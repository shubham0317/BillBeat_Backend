package com.billbeat;

import com.billbeat.dto.request.GenerateBillRequest;
import com.billbeat.entity.*;
import com.billbeat.enums.BillStatus;
import com.billbeat.exception.DuplicateResourceException;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.repository.WhatsAppMessageRepository;
import com.billbeat.security.UserPrincipal;
import com.billbeat.service.BillService;
import com.billbeat.service.WhatsAppMessageService;
import com.billbeat.service.strategy.BillingCalculationStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private BillRepository billRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private VendorRepository vendorRepository;
    @Mock
    private BillingCalculationStrategy billingCalculationStrategy;
    @Mock
    private WhatsAppMessageService whatsAppMessageService;
    @Mock
    private WhatsAppMessageRepository whatsAppMessageRepository;

    @InjectMocks
    private BillService billService;

    private Vendor vendor;
    private Customer customer;

    @BeforeEach
    void setUp() {
        vendor = Vendor.builder().id(1L).businessName("Test Paper Vendor").build();
        customer = Customer.builder().id(10L).name("Rahul Sharma").mobileNumber("9876543210").vendor(vendor).build();

        UserPrincipal principal = UserPrincipal.builder()
                .id(100L)
                .username("vendor1")
                .vendorId(1L)
                .authorities(Collections.emptyList())
                .build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testCreateSingleBill_Success() {
        YearMonth period = YearMonth.of(2026, 8);

        when(billRepository.existsByCustomerIdAndBillingPeriod(10L, "2026-08")).thenReturn(false);

        BillItem item = BillItem.builder()
                .newspaperName("Dainik Bhaskar")
                .copies(1)
                .unitPrice(new BigDecimal("5.00"))
                .daysCount(31)
                .amount(new BigDecimal("155.00"))
                .build();

        when(billingCalculationStrategy.calculateBillItems(eq(customer), eq(period)))
                .thenReturn(List.of(item));

        when(billRepository.findPreviousBills(10L, "2026-08")).thenReturn(Collections.emptyList());

        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> {
            Bill b = invocation.getArgument(0);
            b.setId(1001L);
            return b;
        });

        Bill result = billService.createSingleBill(customer, vendor, period);

        assertNotNull(result);
        assertEquals(new BigDecimal("155.00"), result.getCurrentAmount());
        assertEquals(new BigDecimal("155.00"), result.getTotalAmount());
        assertEquals(BillStatus.UNPAID, result.getStatus());
        verify(billRepository, times(1)).save(any(Bill.class));
    }

    @Test
    void testGenerateBill_PreventDuplicate() {
        GenerateBillRequest request = new GenerateBillRequest();
        request.setCustomerId(10L);
        request.setBillingPeriod("2026-08");

        when(vendorRepository.findById(1L)).thenReturn(Optional.of(vendor));
        when(customerRepository.findByIdAndVendorId(10L, 1L)).thenReturn(Optional.of(customer));
        when(billRepository.existsByCustomerIdAndBillingPeriod(10L, "2026-08")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> billService.generateBills(request));
    }
}
