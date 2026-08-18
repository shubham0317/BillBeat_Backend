package com.billbeat.repository;

import com.billbeat.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    List<Delivery> findAllByVendorIdAndDeliveryDate(Long vendorId, LocalDate deliveryDate);

    @Query("SELECT d FROM Delivery d WHERE d.vendor.id = :vendorId AND d.deliveryDate = :deliveryDate " +
           "AND (:beatId IS NULL OR d.customer.beat.id = :beatId) " +
           "AND (:paperBoyId IS NULL OR d.paperBoy.id = :paperBoyId OR (d.paperBoy IS NULL AND d.customer.beat.defaultPaperBoy.id = :paperBoyId))")
    List<Delivery> findDeliveriesForDate(@Param("vendorId") Long vendorId,
                                         @Param("deliveryDate") LocalDate deliveryDate,
                                         @Param("beatId") Long beatId,
                                         @Param("paperBoyId") Long paperBoyId);

    Optional<Delivery> findByIdAndVendorId(Long id, Long vendorId);

    Optional<Delivery> findBySubscriptionIdAndDeliveryDate(Long subscriptionId, LocalDate deliveryDate);
}
