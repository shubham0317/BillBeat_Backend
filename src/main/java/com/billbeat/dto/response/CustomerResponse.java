package com.billbeat.dto.response;

import com.billbeat.enums.BillStatus;
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
public class CustomerResponse {

    private Long id;
    private String name;
    private String mobileNumber;
    private String alternateMobile;
    private String address;
    private Long beatId;
    private String beatName;
    private Long paperBoyId;
    private String paperBoyName;
    private String notes;
    private boolean whatsAppEnabled;
    private boolean active;
    private int activeSubscriptionsCount;
    private BigDecimal currentBillAmount;
    private BigDecimal dueAmount;
    private BillStatus billStatus;
    private LocalDateTime createdAt;
}
