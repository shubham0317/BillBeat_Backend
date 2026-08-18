package com.billbeat.dto.response;

import com.billbeat.dto.request.DeliveryScheduleDto;
import com.billbeat.enums.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long newspaperId;
    private String newspaperName;
    private Integer copies;
    private BigDecimal pricePerCopy;
    private LocalDate startDate;
    private LocalDate endDate;
    private SubscriptionStatus status;
    private DeliveryScheduleDto deliverySchedule;
    private LocalDateTime createdAt;
}
