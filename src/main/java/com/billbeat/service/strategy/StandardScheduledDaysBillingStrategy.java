package com.billbeat.service.strategy;

import com.billbeat.entity.BillItem;
import com.billbeat.entity.Customer;
import com.billbeat.entity.DeliverySchedule;
import com.billbeat.entity.Subscription;
import com.billbeat.enums.SubscriptionStatus;
import com.billbeat.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "billbeat.billing.strategy", havingValue = "SCHEDULED_DAYS", matchIfMissing = true)
@RequiredArgsConstructor
public class StandardScheduledDaysBillingStrategy implements BillingCalculationStrategy {

    private final SubscriptionRepository subscriptionRepository;

    @Override
    public List<BillItem> calculateBillItems(Customer customer, YearMonth billingPeriod) {
        List<Subscription> subscriptions = subscriptionRepository.findAllByCustomerIdAndStatus(
                customer.getId(), SubscriptionStatus.ACTIVE);

        List<BillItem> billItems = new ArrayList<>();
        LocalDate periodStart = billingPeriod.atDay(1);
        LocalDate periodEnd = billingPeriod.atEndOfMonth();

        for (Subscription sub : subscriptions) {
            LocalDate effectiveStart = sub.getStartDate().isAfter(periodStart) ? sub.getStartDate() : periodStart;
            LocalDate effectiveEnd = (sub.getEndDate() != null && sub.getEndDate().isBefore(periodEnd)) ? sub.getEndDate() : periodEnd;

            if (effectiveStart.isAfter(effectiveEnd)) {
                continue;
            }

            DeliverySchedule schedule = sub.getDeliverySchedule();
            int daysCount = 0;

            for (LocalDate date = effectiveStart; !date.isAfter(effectiveEnd); date = date.plusDays(1)) {
                if (isDeliveryDay(date.getDayOfWeek(), schedule)) {
                    daysCount++;
                }
            }

            if (daysCount > 0) {
                BigDecimal copies = BigDecimal.valueOf(sub.getCopies());
                BigDecimal days = BigDecimal.valueOf(daysCount);
                BigDecimal amount = sub.getPricePerCopy().multiply(copies).multiply(days);

                BillItem item = BillItem.builder()
                        .newspaperName(sub.getNewspaper().getName())
                        .copies(sub.getCopies())
                        .unitPrice(sub.getPricePerCopy())
                        .daysCount(daysCount)
                        .amount(amount)
                        .build();

                billItems.add(item);
            }
        }

        return billItems;
    }

    private boolean isDeliveryDay(DayOfWeek dayOfWeek, DeliverySchedule schedule) {
        if (schedule == null) return true;
        return switch (dayOfWeek) {
            case MONDAY -> schedule.isMonday();
            case TUESDAY -> schedule.isTuesday();
            case WEDNESDAY -> schedule.isWednesday();
            case THURSDAY -> schedule.isThursday();
            case FRIDAY -> schedule.isFriday();
            case SATURDAY -> schedule.isSaturday();
            case SUNDAY -> schedule.isSunday();
        };
    }
}
