package com.billbeat.service;

import com.billbeat.dto.request.CustomerRequest;
import com.billbeat.dto.response.CustomerResponse;
import com.billbeat.dto.response.PagedResponse;
import com.billbeat.entity.Beat;
import com.billbeat.entity.Bill;
import com.billbeat.entity.Customer;
import com.billbeat.entity.PaperBoy;
import com.billbeat.entity.Vendor;
import com.billbeat.enums.BillStatus;
import com.billbeat.enums.SubscriptionStatus;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.*;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BeatRepository beatRepository;
    private final PaperBoyRepository paperBoyRepository;
    private final VendorRepository vendorRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BillRepository billRepository;

    public PagedResponse<CustomerResponse> searchCustomers(Long beatId, String billStatus, String search, int page, int size) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());

        String normalizedStatus = (billStatus != null && !billStatus.isBlank() && !"ALL".equalsIgnoreCase(billStatus))
                ? billStatus.toUpperCase() : null;
        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Customer> customerPage = customerRepository.searchCustomers(vendorId, beatId, normalizedStatus, normalizedSearch, pageable);
        Page<CustomerResponse> responsePage = customerPage.map(this::mapToResponse);

        return PagedResponse.fromPage(responsePage);
    }

    public CustomerResponse getCustomerById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Customer customer = customerRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));
        return mapToResponse(customer);
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        Beat beat = beatRepository.findByIdAndVendorId(request.getBeatId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Beat not found with ID: " + request.getBeatId()));

        PaperBoy paperBoy = null;
        if (request.getPaperBoyId() != null) {
            paperBoy = paperBoyRepository.findByIdAndVendorId(request.getPaperBoyId(), vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + request.getPaperBoyId()));
        }

        Customer customer = Customer.builder()
                .name(request.getName())
                .mobileNumber(request.getMobileNumber())
                .alternateMobile(request.getAlternateMobile())
                .address(request.getAddress())
                .beat(beat)
                .paperBoy(paperBoy)
                .vendor(vendor)
                .notes(request.getNotes())
                .whatsAppEnabled(request.getWhatsAppEnabled() != null ? request.getWhatsAppEnabled() : true)
                .active(true)
                .build();

        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Customer customer = customerRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        Beat beat = beatRepository.findByIdAndVendorId(request.getBeatId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Beat not found with ID: " + request.getBeatId()));

        PaperBoy paperBoy = null;
        if (request.getPaperBoyId() != null) {
            paperBoy = paperBoyRepository.findByIdAndVendorId(request.getPaperBoyId(), vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Paper Boy not found with ID: " + request.getPaperBoyId()));
        }

        customer.setName(request.getName());
        customer.setMobileNumber(request.getMobileNumber());
        customer.setAlternateMobile(request.getAlternateMobile());
        customer.setAddress(request.getAddress());
        customer.setBeat(beat);
        customer.setPaperBoy(paperBoy);
        customer.setNotes(request.getNotes());
        if (request.getWhatsAppEnabled() != null) {
            customer.setWhatsAppEnabled(request.getWhatsAppEnabled());
        }

        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    @Transactional
    public CustomerResponse patchCustomerStatus(Long id, Boolean active, Boolean whatsAppEnabled) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Customer customer = customerRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        if (active != null) {
            customer.setActive(active);
        }
        if (whatsAppEnabled != null) {
            customer.setWhatsAppEnabled(whatsAppEnabled);
        }

        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    private CustomerResponse mapToResponse(Customer customer) {
        int activeSubCount = subscriptionRepository.findAllByCustomerIdAndStatus(customer.getId(), SubscriptionStatus.ACTIVE).size();
        
        List<Bill> bills = billRepository.findAllByCustomerIdAndVendorIdOrderByBillingPeriodDesc(customer.getId(), customer.getVendor().getId());
        BigDecimal currentBillAmount = BigDecimal.ZERO;
        BigDecimal dueAmount = BigDecimal.ZERO;
        BillStatus status = BillStatus.PAID;

        if (!bills.isEmpty()) {
            Bill latestBill = bills.get(0);
            currentBillAmount = latestBill.getCurrentAmount();
            dueAmount = latestBill.getDueAmount();
            status = latestBill.getStatus();
        }

        PaperBoy assignedPaperBoy = customer.getPaperBoy() != null 
                ? customer.getPaperBoy() 
                : customer.getBeat().getDefaultPaperBoy();

        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .mobileNumber(customer.getMobileNumber())
                .alternateMobile(customer.getAlternateMobile())
                .address(customer.getAddress())
                .beatId(customer.getBeat().getId())
                .beatName(customer.getBeat().getName())
                .paperBoyId(assignedPaperBoy != null ? assignedPaperBoy.getId() : null)
                .paperBoyName(assignedPaperBoy != null ? assignedPaperBoy.getName() : null)
                .notes(customer.getNotes())
                .whatsAppEnabled(customer.isWhatsAppEnabled())
                .active(customer.isActive())
                .activeSubscriptionsCount(activeSubCount)
                .currentBillAmount(currentBillAmount)
                .dueAmount(dueAmount)
                .billStatus(status)
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
