package com.billbeat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class CustomerRequest {

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    private String alternateMobile;

    @NotBlank(message = "Address is required")
    private String address;

    @NotNull(message = "Beat ID is required")
    private Long beatId;

    private Long paperBoyId;
    private String notes;
    private Boolean whatsAppEnabled = true;
}
