package com.branddashboard.controller;

import com.branddashboard.dto.EmbedTokenResponse;
import com.branddashboard.model.User;
import com.branddashboard.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/brands/{brandId}/reports")
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    @Value("${superset.guest_token.secret}")
    private String supersetSecret;

    // This should be updated with actual dashboard UUID from Superset
    private static final String SUPERSET_DASHBOARD_ID = "938de2fd-883a-4107-86a9-d5a030e1209f";

    @GetMapping("/iframe")
    public ResponseEntity<EmbedTokenResponse> getReportIframe(@PathVariable String brandId) {
        try {
            User user = getCurrentUser();
            if (user.getBrandIds().contains(brandId)) {
                String token = generateGuestToken(user, brandId);
                return ResponseEntity.ok(new EmbedTokenResponse(token));
            } else {
                return ResponseEntity.status(403).build(); // Forbidden
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    private String generateGuestToken(User user, String brandId) {
        try {
            // Current time
            long now = Instant.now().getEpochSecond();
            long exp = now + 300; // 5 minutes from now
            
            // User information for the guest token
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", "guest_" + user.getEmailId().replace("@", "_"));
            userInfo.put("first_name", "Guest");
            userInfo.put("last_name", "User");
            
            // Resource that the user can access
            Map<String, Object> resource = new HashMap<>();
            resource.put("type", "dashboard");
            resource.put("id", SUPERSET_DASHBOARD_ID);
            
            // Optional: Row Level Security rules
            // Only include if you have RLS setup in your datasets
            /*
            Map<String, Object> rlsRule = new HashMap<>();
            rlsRule.put("clause", "brand_id = '" + brandId + "'");
            rlsRule.put("dataset", 1); // Replace with actual dataset ID
            */
            
            // Build the JWT claims
            Map<String, Object> claims = new HashMap<>();
            claims.put("user", userInfo);
            claims.put("resources", Collections.singletonList(resource));
            // claims.put("rls", Collections.singletonList(rlsRule)); // Uncomment if using RLS
            claims.put("iat", now);
            claims.put("exp", exp);
            claims.put("aud", "superset");
            claims.put("type", "guest");
            
            // Generate JWT token
            String token = Jwts.builder()
                    .setClaims(claims)
                    .signWith(SignatureAlgorithm.HS256, supersetSecret.getBytes())
                    .compact();
            
            System.out.println("Generated guest token for brand: " + brandId);
            System.out.println("Dashboard ID: " + SUPERSET_DASHBOARD_ID);
            System.out.println("Token expires in 5 minutes");
            
            return token;
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate guest token", e);
        }
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        return userRepository.findByEmailId(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
