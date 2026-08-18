package com.billbeat.repository;

import com.billbeat.entity.WhatsAppMessage;
import com.billbeat.enums.MessageStatus;
import com.billbeat.enums.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsAppMessageRepository extends JpaRepository<WhatsAppMessage, Long> {

    Optional<WhatsAppMessage> findByBillIdAndMessageType(Long billId, MessageType messageType);

    Optional<WhatsAppMessage> findByProviderMessageId(String providerMessageId);

    List<WhatsAppMessage> findByStatusInAndAttemptCountLessThan(List<MessageStatus> statuses, Integer maxAttempts);

    Optional<WhatsAppMessage> findByBillIdAndVendorId(Long billId, Long vendorId);

    boolean existsByBillIdAndMessageType(Long billId, MessageType messageType);
}
