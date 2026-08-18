package com.billbeat.service;

import com.billbeat.dto.request.PaymentRequest;
import com.billbeat.dto.response.PaymentResponse;
import com.billbeat.entity.Bill;
import com.billbeat.entity.Payment;
import com.billbeat.enums.BillStatus;
import com.billbeat.exception.PaymentException;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.BillRepository;
import com.billbeat.repository.PaymentRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;

    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentException("Payment amount must be greater than zero");
        }

        Bill bill = billRepository.findByIdAndVendorId(request.getBillId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + request.getBillId()));

        if (bill.getDueAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentException("Bill is already fully paid");
        }

        if (request.getAmount().compareTo(bill.getDueAmount()) > 0) {
            throw new PaymentException("Payment amount (" + request.getAmount() + ") cannot exceed total due amount (" + bill.getDueAmount() + ")");
        }

        Payment payment = Payment.builder()
                .bill(bill)
                .customer(bill.getCustomer())
                .vendor(bill.getVendor())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .transactionRef(request.getTransactionRef())
                .notes(request.getNotes())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newPaidAmount = bill.getPaidAmount().add(request.getAmount());
        BigDecimal newDueAmount = bill.getTotalAmount().subtract(newPaidAmount);

        bill.setPaidAmount(newPaidAmount);
        bill.setDueAmount(newDueAmount);

        if (newDueAmount.compareTo(BigDecimal.ZERO) == 0) {
            bill.setStatus(BillStatus.PAID);
        } else if (newPaidAmount.compareTo(BigDecimal.ZERO) > 0) {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        } else {
            bill.setStatus(BillStatus.UNPAID);
        }

        billRepository.save(bill);

        return mapToResponse(savedPayment, bill.getDueAmount());
    }

    public List<PaymentResponse> getPaymentsForBill(Long billId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Bill bill = billRepository.findByIdAndVendorId(billId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + billId));

        List<Payment> payments = paymentRepository.findAllByBillId(bill.getId());
        return payments.stream().map(p -> mapToResponse(p, bill.getDueAmount())).toList();
    }

    public List<PaymentResponse> getPaymentsForCustomer(Long customerId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<Payment> payments = paymentRepository.findAllByCustomerIdAndVendorIdOrderByPaymentDateDesc(customerId, vendorId);
        return payments.stream().map(p -> mapToResponse(p, p.getBill().getDueAmount())).toList();
    }

    private PaymentResponse mapToResponse(Payment payment, BigDecimal remainingDue) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .billId(payment.getBill().getId())
                .customerId(payment.getCustomer().getId())
                .customerName(payment.getCustomer().getName())
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .paymentMethod(payment.getPaymentMethod())
                .transactionRef(payment.getTransactionRef())
                .notes(payment.getNotes())
                .remainingBillDueAmount(remainingDue)
                .build();
    }
}
