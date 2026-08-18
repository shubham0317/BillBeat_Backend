package com.billbeat.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryScheduleDto {

    @Builder.Default
    private boolean monday = true;
    @Builder.Default
    private boolean tuesday = true;
    @Builder.Default
    private boolean wednesday = true;
    @Builder.Default
    private boolean thursday = true;
    @Builder.Default
    private boolean friday = true;
    @Builder.Default
    private boolean saturday = true;
    @Builder.Default
    private boolean sunday = true;
}
