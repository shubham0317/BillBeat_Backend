package com.billbeat.dto.response;

import com.billbeat.enums.BillStatus;
import com.billbeat.enums.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private Long vendorId;
    private String billingPeriod;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal currentAmount;
    private BigDecimal previousOutstanding;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal dueAmount;
    private BillStatus status;
    private List<BillItemResponse> billItems;
    private MessageStatus whatsAppStatus;
    private String whatsAppProviderMessageId;
    private LocalDateTime createdAt;
}
