package com.billbeat.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class NewspaperRequest {

    @NotBlank(message = "Newspaper name is required")
    private String name;

    private String code;

    @NotNull(message = "Default price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal defaultPrice;

    private String language;
}
