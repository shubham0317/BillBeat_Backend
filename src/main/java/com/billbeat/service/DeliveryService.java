package com.billbeat.service;

import com.billbeat.dto.response.DeliveryResponse;
import com.billbeat.entity.*;
import com.billbeat.enums.DeliveryStatus;
import com.billbeat.enums.SubscriptionStatus;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.DeliveryRepository;
import com.billbeat.repository.SubscriptionRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional
    public List<DeliveryResponse> getTodayDeliveries(Long beatId, Long paperBoyId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        LocalDate today = LocalDate.now();

        generateDeliveriesForDateAndVendor(today, vendorId);

        List<Delivery> deliveries = deliveryRepository.findDeliveriesForDate(vendorId, today, beatId, paperBoyId);
        return deliveries.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long id, DeliveryStatus status) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Delivery delivery = deliveryRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery record not found with ID: " + id));

        delivery.setStatus(status);
        Delivery updated = deliveryRepository.save(delivery);
        return mapToResponse(updated);
    }

    @Transactional
    public List<DeliveryResponse> generateTodayDeliveries() {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        LocalDate today = LocalDate.now();
        generateDeliveriesForDateAndVendor(today, vendorId);

        List<Delivery> deliveries = deliveryRepository.findAllByVendorIdAndDeliveryDate(vendorId, today);
        return deliveries.stream().map(this::mapToResponse).toList();
    }

    private void generateDeliveriesForDateAndVendor(LocalDate date, Long vendorId) {
        List<Subscription> activeSubs = subscriptionRepository.findAllByVendorIdAndStatus(vendorId, SubscriptionStatus.ACTIVE);
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        for (Subscription sub : activeSubs) {
            if (sub.getStartDate().isAfter(date) || (sub.getEndDate() != null && sub.getEndDate().isBefore(date))) {
                continue;
            }

            DeliverySchedule sched = sub.getDeliverySchedule();
            if (!isDeliveryScheduled(dayOfWeek, sched)) {
                continue;
            }

            if (deliveryRepository.findBySubscriptionIdAndDeliveryDate(sub.getId(), date).isPresent()) {
                continue;
            }

            Customer customer = sub.getCustomer();
            PaperBoy assignedPaperBoy = customer.getPaperBoy() != null
                    ? customer.getPaperBoy()
                    : customer.getBeat().getDefaultPaperBoy();

            Delivery delivery = Delivery.builder()
                    .subscription(sub)
                    .customer(customer)
                    .vendor(sub.getVendor())
                    .paperBoy(assignedPaperBoy)
                    .deliveryDate(date)
                    .copiesDelivered(sub.getCopies())
                    .status(DeliveryStatus.DELIVERED)
                    .build();

            deliveryRepository.save(delivery);
        }
    }

    private boolean isDeliveryScheduled(DayOfWeek dayOfWeek, DeliverySchedule sched) {
        if (sched == null) return true;
        return switch (dayOfWeek) {
            case MONDAY -> sched.isMonday();
            case TUESDAY -> sched.isTuesday();
            case WEDNESDAY -> sched.isWednesday();
            case THURSDAY -> sched.isThursday();
            case FRIDAY -> sched.isFriday();
            case SATURDAY -> sched.isSaturday();
            case SUNDAY -> sched.isSunday();
        };
    }

    private DeliveryResponse mapToResponse(Delivery delivery) {
        Customer c = delivery.getCustomer();
        PaperBoy pb = delivery.getPaperBoy();
        if (pb == null && c.getBeat() != null) {
            pb = c.getBeat().getDefaultPaperBoy();
        }

        return DeliveryResponse.builder()
                .id(delivery.getId())
                .subscriptionId(delivery.getSubscription().getId())
                .customerId(c.getId())
                .customerName(c.getName())
                .customerAddress(c.getAddress())
                .beatId(c.getBeat().getId())
                .beatName(c.getBeat().getName())
                .paperBoyId(pb != null ? pb.getId() : null)
                .paperBoyName(pb != null ? pb.getName() : null)
                .newspaperName(delivery.getSubscription().getNewspaper().getName())
                .copiesDelivered(delivery.getCopiesDelivered())
                .deliveryDate(delivery.getDeliveryDate())
                .status(delivery.getStatus())
                .build();
    }
}
