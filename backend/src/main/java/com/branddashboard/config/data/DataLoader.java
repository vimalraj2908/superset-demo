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
import java.util.*;

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

        // Create 5 brands of different types
        List<Brand> brands = createBrands();
        brandRepository.saveAll(brands);

        // Create users for each brand (5-20 users per brand)
        List<User> users = createUsersForBrands(brands);
        
        // Add a specific test user for easier testing
        User testUser = createTestUser(brands.get(0).getId());
        users.add(testUser);
        
        // Add the default admin user
        User defaultAdminUser = createDefaultAdminUser(brands.get(0).getId());
        users.add(defaultAdminUser);
        
        userRepository.saveAll(users);

        System.out.println("✅ Created " + brands.size() + " brands and " + users.size() + " users");
        System.out.println("🔑 Test user: test@example.com / password123");
        System.out.println("🔑 Default admin: om-stage@ausmit.in / password");
    }

    private User createDefaultAdminUser(String brandId) {
        User defaultUser = new User();
        defaultUser.setId("67f9136725ec2d0557105b75");
        defaultUser.setEmailId("om-stage@ausmit.in");
        defaultUser.setPassword(passwordEncoder.encode("password"));
        defaultUser.setRole("ADMIN");
        defaultUser.setMobile("4964569693");
        defaultUser.setVerified(true);
        defaultUser.setActive(true);
        defaultUser.setDeleted(false);
        defaultUser.setBrandIds(Collections.singletonList(brandId));
        defaultUser.setCreatedAt(new Date());
        defaultUser.setUpdatedAt(new Date());
        return defaultUser;
    }

    private User createTestUser(String brandId) {
        User testUser = new User();
        testUser.setId("test-user-001");
        testUser.setEmailId("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setRole("ADMIN");
        testUser.setMobile("9876543210");
        testUser.setVerified(true);
        testUser.setActive(true);
        testUser.setDeleted(false);
        testUser.setBrandIds(Collections.singletonList(brandId));
        testUser.setCreatedAt(new Date());
        testUser.setUpdatedAt(new Date());
        return testUser;
    }

    private List<Brand> createBrands() {
        List<Brand> brands = new ArrayList<>();
        
        // Brand 1: RETAILER
        Brand retailerBrand = new Brand();
        retailerBrand.setId("67fc96b0026fe55bd8ea553a");
        retailerBrand.setAccessId("67fc95ac026fe55bd8ea5517");
        retailerBrand.setBrandCode("RETAIL001");
        retailerBrand.setName("SuperMart Retail");
        retailerBrand.setInceptionDate(LocalDate.parse("2020-01-15"));
        retailerBrand.setRating(4);
        retailerBrand.setBrandType("RETAILER");
        retailerBrand.setStatus("APPROVED");
        retailerBrand.setGstIn("27REST21234F1Z5");
        retailerBrand.setCreatedAt(new Date());
        retailerBrand.setUpdatedAt(new Date());
        brands.add(retailerBrand);

        // Brand 2: MANUFACTURER
        Brand manufacturerBrand = new Brand();
        manufacturerBrand.setId("67fc96b0026fe55bd8ea553b");
        manufacturerBrand.setAccessId("67fc95ac026fe55bd8ea5518");
        manufacturerBrand.setBrandCode("MFG002");
        manufacturerBrand.setName("TechCorp Manufacturing");
        manufacturerBrand.setInceptionDate(LocalDate.parse("2018-06-20"));
        manufacturerBrand.setRating(5);
        manufacturerBrand.setBrandType("MANUFACTURER");
        manufacturerBrand.setStatus("APPROVED");
        manufacturerBrand.setGstIn("27MFG21234F1Z6");
        manufacturerBrand.setCreatedAt(new Date());
        manufacturerBrand.setUpdatedAt(new Date());
        brands.add(manufacturerBrand);

        // Brand 3: DISTRIBUTOR
        Brand distributorBrand = new Brand();
        distributorBrand.setId("67fc96b0026fe55bd8ea553c");
        distributorBrand.setAccessId("67fc95ac026fe55bd8ea5519");
        distributorBrand.setBrandCode("DIST003");
        distributorBrand.setName("Global Distribution Ltd");
        distributorBrand.setInceptionDate(LocalDate.parse("2019-03-10"));
        distributorBrand.setRating(4);
        distributorBrand.setBrandType("DISTRIBUTOR");
        distributorBrand.setStatus("APPROVED");
        distributorBrand.setGstIn("27DIST21234F1Z7");
        distributorBrand.setCreatedAt(new Date());
        distributorBrand.setUpdatedAt(new Date());
        brands.add(distributorBrand);

        // Brand 4: WHOLESALER
        Brand wholesalerBrand = new Brand();
        wholesalerBrand.setId("67fc96b0026fe55bd8ea553d");
        wholesalerBrand.setAccessId("67fc95ac026fe55bd8ea5520");
        wholesalerBrand.setBrandCode("WHOLE004");
        wholesalerBrand.setName("Bulk Supply Co");
        wholesalerBrand.setInceptionDate(LocalDate.parse("2021-09-05"));
        wholesalerBrand.setRating(3);
        wholesalerBrand.setBrandType("WHOLESALER");
        wholesalerBrand.setStatus("APPROVED");
        wholesalerBrand.setGstIn("27WHOLE21234F1Z8");
        wholesalerBrand.setCreatedAt(new Date());
        wholesalerBrand.setUpdatedAt(new Date());
        brands.add(wholesalerBrand);

        // Brand 5: E-COMMERCE
        Brand ecommerceBrand = new Brand();
        ecommerceBrand.setId("67fc96b0026fe55bd8ea553e");
        ecommerceBrand.setAccessId("67fc95ac026fe55bd8ea5521");
        ecommerceBrand.setBrandCode("ECOMM005");
        ecommerceBrand.setName("Digital Marketplace");
        ecommerceBrand.setInceptionDate(LocalDate.parse("2022-01-01"));
        ecommerceBrand.setRating(5);
        ecommerceBrand.setBrandType("E-COMMERCE");
        ecommerceBrand.setStatus("APPROVED");
        ecommerceBrand.setGstIn("27ECOMM21234F1Z9");
        ecommerceBrand.setCreatedAt(new Date());
        ecommerceBrand.setUpdatedAt(new Date());
        brands.add(ecommerceBrand);

        return brands;
    }

    private List<User> createUsersForBrands(List<Brand> brands) {
        List<User> users = new ArrayList<>();
        Random random = new Random();
        
        String[] roles = {"ADMIN", "MANAGER", "OPERATOR", "VIEWER", "ANALYST"};
        String[] domains = {"gmail.com", "yahoo.com", "outlook.com", "company.com", "business.org"};
        
        for (Brand brand : brands) {
            // Generate random number of users between 5-20 for each brand
            int userCount = 5 + random.nextInt(16); // 5 to 20 users
            
            for (int i = 1; i <= userCount; i++) {
                User user = new User();
                user.setId(UUID.randomUUID().toString());
                user.setEmailId(generateEmail(brand.getName(), i, domains[random.nextInt(domains.length)]));
                user.setPassword(passwordEncoder.encode("password123"));
                user.setRole(roles[random.nextInt(roles.length)]);
                user.setMobile(generateMobile());
                user.setVerified(true);
                user.setActive(true);
                user.setDeleted(false);
                user.setBrandIds(Collections.singletonList(brand.getId()));
                user.setCreatedAt(new Date());
                user.setUpdatedAt(new Date());
                users.add(user);
            }
        }
        
        return users;
    }

    private String generateEmail(String brandName, int userNumber, String domain) {
        String cleanBrandName = brandName.toLowerCase().replaceAll("[^a-z0-9]", "");
        return String.format("user%d@%s.%s", userNumber, cleanBrandName, domain);
    }

    private String generateMobile() {
        Random random = new Random();
        return String.format("9%08d", random.nextInt(100000000));
    }
}
