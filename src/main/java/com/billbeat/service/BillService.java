package com.billbeat.service;

import com.billbeat.dto.request.GenerateBillRequest;
import com.billbeat.dto.response.BillItemResponse;
import com.billbeat.dto.response.BillResponse;
import com.billbeat.dto.response.PagedResponse;
import com.billbeat.entity.*;
import com.billbeat.enums.BillStatus;
import com.billbeat.enums.MessageType;
import com.billbeat.exception.DuplicateResourceException;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.repository.WhatsAppMessageRepository;
import com.billbeat.service.strategy.BillingCalculationStrategy;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private static final Logger log = LoggerFactory.getLogger(BillService.class);

    private final BillRepository billRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final BillingCalculationStrategy billingCalculationStrategy;
    private final WhatsAppMessageService whatsAppMessageService;
    private final WhatsAppMessageRepository whatsAppMessageRepository;

    public PagedResponse<BillResponse> searchBills(Long customerId, BillStatus status, String billingPeriod, int page, int size) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("billingPeriod").descending().and(Sort.by("id").descending()));

        Page<Bill> billPage = billRepository.searchBills(vendorId, customerId, status, billingPeriod, pageable);
        Page<BillResponse> responsePage = billPage.map(this::mapToResponse);

        return PagedResponse.fromPage(responsePage);
    }

    public BillResponse getBillById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Bill bill = billRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));
        return mapToResponse(bill);
    }

    @Transactional
    public List<BillResponse> generateBills(GenerateBillRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        YearMonth billingPeriod = YearMonth.parse(request.getBillingPeriod());

        List<Customer> targetCustomers = new ArrayList<>();
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndVendorId(request.getCustomerId(), vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));
            targetCustomers.add(customer);
        } else {
            targetCustomers = customerRepository.findAllByVendorId(vendorId);
        }

        List<BillResponse> generatedBills = new ArrayList<>();

        for (Customer customer : targetCustomers) {
            try {
                if (billRepository.existsByCustomerIdAndBillingPeriod(customer.getId(), billingPeriod.toString())) {
                    if (request.getCustomerId() != null) {
                        throw new DuplicateResourceException("Bill for customer '" + customer.getName() + "' and period '" + billingPeriod + "' already exists.");
                    } else {
                        log.info("Bill already generated for customer ID {} and period {}, skipping.", customer.getId(), billingPeriod);
                        continue;
                    }
                }

                Bill bill = createSingleBill(customer, vendor, billingPeriod);
                if (bill != null) {
                    whatsAppMessageService.queueBillNotification(bill);
                    generatedBills.add(mapToResponse(bill));
                }
            } catch (DuplicateResourceException ex) {
                throw ex;
            } catch (Exception ex) {
                log.error("Error generating bill for customer ID {}: {}", customer.getId(), ex.getMessage());
            }
        }

        return generatedBills;
    }

    @Transactional
    public Bill createSingleBill(Customer customer, Vendor vendor, YearMonth billingPeriod) {
        if (billRepository.existsByCustomerIdAndBillingPeriod(customer.getId(), billingPeriod.toString())) {
            return billRepository.findByCustomerIdAndBillingPeriod(customer.getId(), billingPeriod.toString()).orElse(null);
        }

        List<BillItem> items = billingCalculationStrategy.calculateBillItems(customer, billingPeriod);
        if (items.isEmpty()) {
            log.info("No active subscriptions or billable items for customer ID {} in period {}", customer.getId(), billingPeriod);
            return null;
        }

        BigDecimal currentAmount = items.stream()
                .map(BillItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Bill> previousBills = billRepository.findPreviousBills(customer.getId(), billingPeriod.toString());
        BigDecimal previousOutstanding = BigDecimal.ZERO;

        for (Bill prev : previousBills) {
            if (prev.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
                previousOutstanding = previousOutstanding.add(prev.getDueAmount());
            }
        }

        BigDecimal totalAmount = currentAmount.add(previousOutstanding);

        Bill bill = Bill.builder()
                .customer(customer)
                .vendor(vendor)
                .billingPeriod(billingPeriod.toString())
                .startDate(billingPeriod.atDay(1))
                .endDate(billingPeriod.atEndOfMonth())
                .currentAmount(currentAmount)
                .previousOutstanding(previousOutstanding)
                .totalAmount(totalAmount)
                .paidAmount(BigDecimal.ZERO)
                .dueAmount(totalAmount)
                .status(BillStatus.UNPAID)
                .build();

        for (BillItem item : items) {
            bill.addBillItem(item);
        }

        return billRepository.save(bill);
    }

    private BillResponse mapToResponse(Bill bill) {
        List<BillItemResponse> itemResponses = bill.getBillItems().stream()
                .map(item -> BillItemResponse.builder()
                        .id(item.getId())
                        .newspaperName(item.getNewspaperName())
                        .copies(item.getCopies())
                        .unitPrice(item.getUnitPrice())
                        .daysCount(item.getDaysCount())
                        .amount(item.getAmount())
                        .build())
                .toList();

        WhatsAppMessage waMsg = whatsAppMessageRepository.findByBillIdAndMessageType(bill.getId(), MessageType.BILL_NOTIFICATION)
                .orElse(null);

        return BillResponse.builder()
                .id(bill.getId())
                .customerId(bill.getCustomer().getId())
                .customerName(bill.getCustomer().getName())
                .customerMobile(bill.getCustomer().getMobileNumber())
                .vendorId(bill.getVendor().getId())
                .billingPeriod(bill.getBillingPeriod())
                .startDate(bill.getStartDate())
                .endDate(bill.getEndDate())
                .currentAmount(bill.getCurrentAmount())
                .previousOutstanding(bill.getPreviousOutstanding())
                .totalAmount(bill.getTotalAmount())
                .paidAmount(bill.getPaidAmount())
                .dueAmount(bill.getDueAmount())
                .status(bill.getStatus())
                .billItems(itemResponses)
                .whatsAppStatus(waMsg != null ? waMsg.getStatus() : null)
                .whatsAppProviderMessageId(waMsg != null ? waMsg.getProviderMessageId() : null)
                .createdAt(bill.getCreatedAt())
                .build();
    }
}
