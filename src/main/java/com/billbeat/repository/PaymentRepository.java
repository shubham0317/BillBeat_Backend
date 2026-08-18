package com.billbeat.repository;

import com.billbeat.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByBillId(Long billId);

    List<Payment> findAllByVendorId(Long vendorId);

    List<Payment> findAllByCustomerIdAndVendorIdOrderByPaymentDateDesc(Long customerId, Long vendorId);
}
