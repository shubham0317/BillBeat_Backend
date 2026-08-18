package com.billbeat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class GenerateBillRequest {

    private Long customerId; // Optional; if null, generates for all eligible customers of authenticated vendor

    @NotBlank(message = "Billing period is required")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Billing period must be in YYYY-MM format")
    private String billingPeriod; // e.g. "2026-08"
}
