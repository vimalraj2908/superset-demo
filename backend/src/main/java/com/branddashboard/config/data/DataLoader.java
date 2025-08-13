package com.branddashboard.config.data;

import com.branddashboard.model.Brand;
import com.branddashboard.model.User;
import com.branddashboard.repository.BrandRepository;
import com.branddashboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Date;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        userRepository.deleteAll();
        brandRepository.deleteAll();

        // Create a brand
        Brand brand = new Brand();
        brand.setId("67fc96b0026fe55bd8ea553a");
        brand.setAccessId("67fc95ac026fe55bd8ea5517");
        brand.setBrandCode("AU1");
        brand.setName("retailer-dev");
        brand.setInceptionDate(LocalDate.parse("2024-02-06"));
        brand.setRating(5);
        brand.setBrandType("RETAILER");
        brand.setStatus("APPROVED");
        brand.setGstIn("27REST21234F1Z5");
        brand.setCreatedAt(Date.from(java.time.ZonedDateTime.parse("2025-04-14T05:01:36.340Z").toInstant()));
        brand.setUpdatedAt(Date.from(java.time.ZonedDateTime.parse("2025-07-14T10:33:09.885Z").toInstant()));
        brandRepository.save(brand);

        // Create a user
        User user = new User();
        user.setId("67f9136725ec2d0557105b75");
        user.setEmailId("om-stage@ausmit.in");
        user.setPassword(passwordEncoder.encode("password")); // Use a secure password
        user.setRole("ADMIN_OPERATION_MANAGER");
        user.setMobile("4964569693");
        user.setVerified(true);
        user.setActive(true);
        user.setDeleted(false);
        user.setBrandIds(Collections.singletonList(brand.getId()));
        user.setCreatedAt(Date.from(java.time.ZonedDateTime.parse("2025-04-11T13:04:39.971Z").toInstant()));
        user.setUpdatedAt(Date.from(java.time.ZonedDateTime.parse("2025-04-11T13:04:39.971Z").toInstant()));
        userRepository.save(user);
    }
}
