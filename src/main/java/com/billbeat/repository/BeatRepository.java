package com.billbeat.repository;

import com.billbeat.entity.Beat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeatRepository extends JpaRepository<Beat, Long> {

    List<Beat> findAllByVendorId(Long vendorId);

    Optional<Beat> findByIdAndVendorId(Long id, Long vendorId);
}
