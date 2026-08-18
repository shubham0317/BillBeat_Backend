package com.billbeat.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SubscriptionRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Newspaper ID is required")
    private Long newspaperId;

    @NotNull(message = "Copies count is required")
    @Min(value = 1, message = "Copies must be at least 1")
    private Integer copies;

    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal pricePerCopy; // Optional; defaults to Newspaper defaultPrice if null

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private DeliveryScheduleDto deliverySchedule;
}
