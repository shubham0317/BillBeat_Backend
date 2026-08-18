package com.billbeat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeatResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Long defaultPaperBoyId;
    private String defaultPaperBoyName;
    private long customerCount;
    private long paidCount;
    private long dueCount;
    private boolean active;
    private LocalDateTime createdAt;
}
