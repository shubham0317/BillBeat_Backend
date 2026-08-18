package com.billbeat.scheduler;

import com.billbeat.entity.Bill;
import com.billbeat.entity.Customer;
import com.billbeat.entity.Vendor;
import com.billbeat.repository.CustomerRepository;
import com.billbeat.repository.VendorRepository;
import com.billbeat.service.BillService;
import com.billbeat.service.WhatsAppMessageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.List;

@Component
@ConditionalOnProperty(name = "billbeat.scheduler.monthly-billing.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class MonthlyBillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlyBillingScheduler.class);

    private final VendorRepository vendorRepository;
    private final CustomerRepository customerRepository;
    private final BillService billService;
    private final WhatsAppMessageService whatsAppMessageService;

    @Scheduled(cron = "${billbeat.scheduler.monthly-billing.cron:0 0 2 1 * ?}")
    public void runMonthlyBillingJob() {
        YearMonth targetPeriod = YearMonth.now().minusMonths(1);
        log.info("Starting automated month-end billing scheduler for period: {}", targetPeriod);

        List<Vendor> vendors = vendorRepository.findAll();
        int totalCustomers = 0;
        int billsGenerated = 0;
        int skipped = 0;
        int errors = 0;

        for (Vendor vendor : vendors) {
            List<Customer> customers = customerRepository.findAllByVendorId(vendor.getId());
            for (Customer customer : customers) {
                totalCustomers++;
                try {
                    Bill bill = billService.createSingleBill(customer, vendor, targetPeriod);
                    if (bill != null) {
                        whatsAppMessageService.queueBillNotification(bill);
                        billsGenerated++;
                    } else {
                        skipped++;
                    }
                } catch (Exception ex) {
                    errors++;
                    log.error("Monthly billing scheduler failed for customer ID {}: {}", customer.getId(), ex.getMessage());
                }
            }
        }

        log.info("Monthly billing scheduler completed for {}. Total: {}, Generated: {}, Skipped: {}, Errors: {}",
                targetPeriod, totalCustomers, billsGenerated, skipped, errors);
    }
}
