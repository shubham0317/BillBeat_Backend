package com.billbeat.repository;

import com.billbeat.entity.DeliverySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryScheduleRepository extends JpaRepository<DeliverySchedule, Long> {

    Optional<DeliverySchedule> findBySubscriptionId(Long subscriptionId);
}
