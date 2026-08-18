package com.billbeat.repository;

import com.billbeat.entity.Subscription;
import com.billbeat.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findAllByVendorId(Long vendorId);

    Optional<Subscription> findByIdAndVendorId(Long id, Long vendorId);

    List<Subscription> findAllByCustomerIdAndVendorId(Long customerId, Long vendorId);

    List<Subscription> findAllByCustomerIdAndStatus(Long customerId, SubscriptionStatus status);

    List<Subscription> findAllByVendorIdAndStatus(Long vendorId, SubscriptionStatus status);
}
