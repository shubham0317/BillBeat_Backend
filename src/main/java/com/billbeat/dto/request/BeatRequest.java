package com.billbeat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BeatRequest {

    @NotBlank(message = "Beat name is required")
    private String name;

    private String code;
    private String description;
    private Long defaultPaperBoyId;
}
