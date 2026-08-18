package com.billbeat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewspaperResponse {

    private Long id;
    private String name;
    private String code;
    private BigDecimal defaultPrice;
    private String language;
    private boolean active;
    private LocalDateTime createdAt;
}
