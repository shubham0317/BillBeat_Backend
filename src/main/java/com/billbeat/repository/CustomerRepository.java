package com.billbeat.repository;

import com.billbeat.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findAllByVendorId(Long vendorId);

    Optional<Customer> findByIdAndVendorId(Long id, Long vendorId);

    long countByVendorIdAndActiveTrue(Long vendorId);

    long countByBeatIdAndActiveTrue(Long beatId);

    @Query("SELECT c FROM Customer c WHERE c.vendor.id = :vendorId " +
           "AND (:beatId IS NULL OR c.beat.id = :beatId) " +
           "AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR c.mobileNumber LIKE CONCAT('%', :search, '%')) " +
           "AND (:billStatus IS NULL OR " +
           "     (:billStatus = 'PAID' AND NOT EXISTS (SELECT b FROM Bill b WHERE b.customer.id = c.id AND b.dueAmount > 0)) OR " +
           "     (:billStatus = 'UNPAID' AND EXISTS (SELECT b FROM Bill b WHERE b.customer.id = c.id AND b.dueAmount > 0)) OR " +
           "     (:billStatus = 'DUE' AND EXISTS (SELECT b FROM Bill b WHERE b.customer.id = c.id AND b.dueAmount > 0))" +
           ")")
    Page<Customer> searchCustomers(@Param("vendorId") Long vendorId,
                                   @Param("beatId") Long beatId,
                                   @Param("billStatus") String billStatus,
                                   @Param("search") String search,
                                   Pageable pageable);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.vendor.id = :vendorId AND c.beat.id = :beatId AND " +
           "EXISTS (SELECT b FROM Bill b WHERE b.customer.id = c.id AND b.dueAmount > 0)")
    long countDueCustomersByBeat(@Param("vendorId") Long vendorId, @Param("beatId") Long beatId);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.vendor.id = :vendorId AND c.beat.id = :beatId AND " +
           "NOT EXISTS (SELECT b FROM Bill b WHERE b.customer.id = c.id AND b.dueAmount > 0)")
    long countPaidCustomersByBeat(@Param("vendorId") Long vendorId, @Param("beatId") Long beatId);
}
