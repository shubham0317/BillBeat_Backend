package com.billbeat.dto.response;

import com.billbeat.enums.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryResponse {

    private Long id;
    private Long subscriptionId;
    private Long customerId;
    private String customerName;
    private String customerAddress;
    private Long beatId;
    private String beatName;
    private Long paperBoyId;
    private String paperBoyName;
    private String newspaperName;
    private Integer copiesDelivered;
    private LocalDate deliveryDate;
    private DeliveryStatus status;
}
