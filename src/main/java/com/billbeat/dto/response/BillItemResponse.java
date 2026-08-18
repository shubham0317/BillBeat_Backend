package com.billbeat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemResponse {

    private Long id;
    private String newspaperName;
    private Integer copies;
    private BigDecimal unitPrice;
    private Integer daysCount;
    private BigDecimal amount;
}
