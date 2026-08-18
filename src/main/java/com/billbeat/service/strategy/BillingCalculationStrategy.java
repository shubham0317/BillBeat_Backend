package com.billbeat.service.strategy;

import com.billbeat.entity.BillItem;
import com.billbeat.entity.Customer;

import java.time.YearMonth;
import java.util.List;

public interface BillingCalculationStrategy {

    List<BillItem> calculateBillItems(Customer customer, YearMonth billingPeriod);
}
