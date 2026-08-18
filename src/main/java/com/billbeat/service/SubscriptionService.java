package com.billbeat.service;

import com.billbeat.dto.request.DeliveryScheduleDto;
import com.billbeat.dto.request.SubscriptionRequest;
import com.billbeat.dto.response.SubscriptionResponse;
import com.billbeat.entity.*;
import com.billbeat.enums.SubscriptionStatus;
import com.billbeat.exception.ResourceNotFoundException;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.NewspaperRepository;
import com.billbeat.repository.SubscriptionRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final NewspaperRepository newspaperRepository;
    private final VendorRepository vendorRepository;

    public List<SubscriptionResponse> getAllSubscriptions() {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<Subscription> subscriptions = subscriptionRepository.findAllByVendorId(vendorId);
        return subscriptions.stream().map(this::mapToResponse).toList();
    }

    public SubscriptionResponse getSubscriptionById(Long id) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Subscription subscription = subscriptionRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));
        return mapToResponse(subscription);
    }

    public List<SubscriptionResponse> getSubscriptionsByCustomerId(Long customerId) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        List<Subscription> subscriptions = subscriptionRepository.findAllByCustomerIdAndVendorId(customerId, vendorId);
        return subscriptions.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        Customer customer = customerRepository.findByIdAndVendorId(request.getCustomerId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

        Newspaper newspaper = newspaperRepository.findByIdAndVendorId(request.getNewspaperId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Newspaper not found with ID: " + request.getNewspaperId()));

        BigDecimal pricePerCopy = (request.getPricePerCopy() != null) ? request.getPricePerCopy() : newspaper.getDefaultPrice();

        Subscription subscription = Subscription.builder()
                .customer(customer)
                .newspaper(newspaper)
                .vendor(vendor)
                .copies(request.getCopies())
                .pricePerCopy(pricePerCopy)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(SubscriptionStatus.ACTIVE)
                .build();

        DeliveryScheduleDto scheduleDto = request.getDeliverySchedule() != null ? request.getDeliverySchedule() : new DeliveryScheduleDto();
        DeliverySchedule schedule = DeliverySchedule.builder()
                .subscription(subscription)
                .monday(scheduleDto.isMonday())
                .tuesday(scheduleDto.isTuesday())
                .wednesday(scheduleDto.isWednesday())
                .thursday(scheduleDto.isThursday())
                .friday(scheduleDto.isFriday())
                .saturday(scheduleDto.isSaturday())
                .sunday(scheduleDto.isSunday())
                .build();

        subscription.setDeliverySchedule(schedule);

        Subscription saved = subscriptionRepository.save(subscription);
        return mapToResponse(saved);
    }

    @Transactional
    public SubscriptionResponse updateSubscription(Long id, SubscriptionRequest request) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Subscription subscription = subscriptionRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));

        Newspaper newspaper = newspaperRepository.findByIdAndVendorId(request.getNewspaperId(), vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Newspaper not found with ID: " + request.getNewspaperId()));

        BigDecimal pricePerCopy = (request.getPricePerCopy() != null) ? request.getPricePerCopy() : newspaper.getDefaultPrice();

        subscription.setNewspaper(newspaper);
        subscription.setCopies(request.getCopies());
        subscription.setPricePerCopy(pricePerCopy);
        subscription.setStartDate(request.getStartDate());
        subscription.setEndDate(request.getEndDate());

        if (request.getDeliverySchedule() != null) {
            DeliverySchedule schedule = subscription.getDeliverySchedule();
            if (schedule == null) {
                schedule = new DeliverySchedule();
                schedule.setSubscription(subscription);
            }
            DeliveryScheduleDto scheduleDto = request.getDeliverySchedule();
            schedule.setMonday(scheduleDto.isMonday());
            schedule.setTuesday(scheduleDto.isTuesday());
            schedule.setWednesday(scheduleDto.isWednesday());
            schedule.setThursday(scheduleDto.isThursday());
            schedule.setFriday(scheduleDto.isFriday());
            schedule.setSaturday(scheduleDto.isSaturday());
            schedule.setSunday(scheduleDto.isSunday());
            subscription.setDeliverySchedule(schedule);
        }

        Subscription updated = subscriptionRepository.save(subscription);
        return mapToResponse(updated);
    }

    @Transactional
    public SubscriptionResponse updateSubscriptionStatus(Long id, SubscriptionStatus status) {
        Long vendorId = SecurityUtils.getCurrentVendorId();
        Subscription subscription = subscriptionRepository.findByIdAndVendorId(id, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));

        subscription.setStatus(status);
        Subscription updated = subscriptionRepository.save(subscription);
        return mapToResponse(updated);
    }

    private SubscriptionResponse mapToResponse(Subscription sub) {
        DeliverySchedule sched = sub.getDeliverySchedule();
        DeliveryScheduleDto scheduleDto = sched != null ? DeliveryScheduleDto.builder()
                .monday(sched.isMonday())
                .tuesday(sched.isTuesday())
                .wednesday(sched.isWednesday())
                .thursday(sched.isThursday())
                .friday(sched.isFriday())
                .saturday(sched.isSaturday())
                .sunday(sched.isSunday())
                .build() : new DeliveryScheduleDto();

        return SubscriptionResponse.builder()
                .id(sub.getId())
                .customerId(sub.getCustomer().getId())
                .customerName(sub.getCustomer().getName())
                .newspaperId(sub.getNewspaper().getId())
                .newspaperName(sub.getNewspaper().getName())
                .copies(sub.getCopies())
                .pricePerCopy(sub.getPricePerCopy())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status(sub.getStatus())
                .deliverySchedule(scheduleDto)
                .createdAt(sub.getCreatedAt())
                .build();
    }
}
