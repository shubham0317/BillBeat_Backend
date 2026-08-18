package com.billbeat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BillBeatApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillBeatApplication.class, args);
    }
}
