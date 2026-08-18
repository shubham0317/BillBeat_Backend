package com.billbeat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliverySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Builder.Default
    @Column(nullable = false)
    private boolean monday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean tuesday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean wednesday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean thursday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean friday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean saturday = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean sunday = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
