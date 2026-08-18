package com.billbeat.repository;

import com.billbeat.entity.Bill;
import com.billbeat.enums.BillStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByIdAndVendorId(Long id, Long vendorId);

    Optional<Bill> findByCustomerIdAndBillingPeriod(Long customerId, String billingPeriod);

    boolean existsByCustomerIdAndBillingPeriod(Long customerId, String billingPeriod);

    List<Bill> findAllByCustomerIdAndVendorIdOrderByBillingPeriodDesc(Long customerId, Long vendorId);

    @Query("SELECT b FROM Bill b WHERE b.vendor.id = :vendorId " +
           "AND (:customerId IS NULL OR b.customer.id = :customerId) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:billingPeriod IS NULL OR b.billingPeriod = :billingPeriod)")
    Page<Bill> searchBills(@Param("vendorId") Long vendorId,
                           @Param("customerId") Long customerId,
                           @Param("status") BillStatus status,
                           @Param("billingPeriod") String billingPeriod,
                           Pageable pageable);

    @Query("SELECT b FROM Bill b WHERE b.customer.id = :customerId AND b.billingPeriod < :billingPeriod ORDER BY b.billingPeriod DESC")
    List<Bill> findPreviousBills(@Param("customerId") Long customerId, @Param("billingPeriod") String billingPeriod);
}
