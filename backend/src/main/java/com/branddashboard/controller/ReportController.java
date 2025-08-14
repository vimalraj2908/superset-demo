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
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;


@RestController
@RequestMapping("/api/brands/{brandId}/reports")
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    @Value("${superset.guest_token.secret}")
    private String supersetSecret;

    private static final String SUPERSET_DASHBOARD_ID = "df2a444a-8df2-43ae-bae6-d61c4a717956"; // Updated to match actual dashboard UUID

    @GetMapping("/iframe")
    public ResponseEntity<EmbedTokenResponse> getReportIframe(@PathVariable String brandId) {
        User user = getCurrentUser();
        if (user.getBrandIds().contains(brandId)) {
            String token = generateGuestToken(user, brandId);
            return ResponseEntity.ok(new EmbedTokenResponse(token));
        } else {
            return ResponseEntity.status(403).build(); // Forbidden
        }
    }

    @GetMapping("/dashboards")
    public ResponseEntity<?> getAvailableDashboards(@PathVariable String brandId) {
        System.out.println("🔍 Dashboard request for brand: " + brandId);
        
        try {
            User user = getCurrentUser();
            System.out.println("👤 Current user: " + user.getEmailId());
            System.out.println("🔑 User's brand IDs: " + user.getBrandIds());
            
            if (user.getBrandIds().contains(brandId)) {
                System.out.println("✅ User authorized for brand: " + brandId);
                
                try {
                    // Get guest token for Superset access
                    String guestToken = generateGuestToken(user, brandId);
                    System.out.println("🎫 Guest token generated successfully");
                    
                    // Use RestTemplate to fetch dashboard list from Superset
                    // This avoids CORS issues and handles redirects properly
                    RestTemplate restTemplate = new RestTemplate();
                    
                    // Set up headers with guest token
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("Authorization", "Bearer " + guestToken);
                    headers.set("Accept", "application/json");
                    
                    HttpEntity<String> entity = new HttpEntity<>(headers);
                    
                    // Fetch dashboard list from Superset
                    // Use container name instead of localhost for proper Docker networking
                    String supersetUrl = "http://superset:8088/superset/dashboard/list/";
                    System.out.println("🌐 Fetching from Superset: " + supersetUrl);
                    
                    ResponseEntity<String> response = restTemplate.exchange(
                        supersetUrl,
                        HttpMethod.GET,
                        entity,
                        String.class
                    );
                    
                    System.out.println("📊 Superset response status: " + response.getStatusCode());
                    
                    if (response.getStatusCode().is2xxSuccessful()) {
                        // Parse the JSON response
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode dashboards = mapper.readTree(response.getBody());
                        
                        System.out.println("✅ Successfully fetched " + dashboards.size() + " dashboards");
                        return ResponseEntity.ok(dashboards);
                    } else {
                        System.out.println("❌ Superset returned non-2xx status: " + response.getStatusCode());
                        return ResponseEntity.status(response.getStatusCode())
                            .body(Map.of("error", "Failed to fetch from Superset", "status", response.getStatusCode()));
                    }
                    
                } catch (Exception e) {
                    System.out.println("❌ Error fetching from Superset: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(500).body(Map.of(
                        "error", "Error fetching dashboard list: " + e.getMessage(),
                        "note", "Check if Superset is running and accessible"
                    ));
                }
            } else {
                System.out.println("❌ User NOT authorized for brand: " + brandId);
                System.out.println("User has access to: " + user.getBrandIds());
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied to this brand",
                    "userBrands", user.getBrandIds(),
                    "requestedBrand", brandId
                ));
            }
        } catch (Exception e) {
            System.out.println("❌ Error in getAvailableDashboards: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/superset-health")
    public ResponseEntity<?> checkSupersetHealth() {
        try {
            // Simple health check without authentication
            RestTemplate restTemplate = new RestTemplate();
            // Use container name instead of localhost for proper Docker networking
            String supersetUrl = "http://superset:8088/superset/health";
            
            ResponseEntity<String> response = restTemplate.getForEntity(supersetUrl, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(Map.of(
                    "status", "healthy",
                    "superset_response", response.getBody(),
                    "note", "Superset is accessible from backend"
                ));
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(Map.of(
                    "status", "unhealthy",
                    "superset_response", response.getBody(),
                    "note", "Superset responded but with non-2xx status"
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "error", e.getMessage(),
                "note", "Superset is not accessible from backend"
            ));
        }
    }

    private String generateGuestToken(User user, String brandId) {
        Map<String, Object> userClaims = new HashMap<>();
        userClaims.put("username", user.getEmailId());
        userClaims.put("first_name", "User"); // You can enhance User model to store first/last names
        userClaims.put("last_name", user.getRole());

        Map<String, Object> resource = new HashMap<>();
        resource.put("type", "dashboard");
        resource.put("id", SUPERSET_DASHBOARD_ID);

        Map<String, Object> rlsRule = new HashMap<>();
        rlsRule.put("clause", "brand_id = '" + brandId + "'");
        // This assumes your table in Superset has a 'brand_id' column.
        // The datasetId needs to be found from your Superset instance.
        rlsRule.put("dataset", 1); // Replace with your actual dataset ID

        Map<String, Object> claims = new HashMap<>();
        claims.put("user", userClaims);
        claims.put("resources", Collections.singletonList(resource));
        claims.put("rls_rules", Collections.singletonList(rlsRule));
        claims.put("iat", Instant.now().getEpochSecond());
        claims.put("exp", Instant.now().getEpochSecond() + 300); // 5 minute expiration
        claims.put("aud", "superset");

        return Jwts.builder()
                .setClaims(claims)
                .signWith(SignatureAlgorithm.HS256, supersetSecret.getBytes())
                .compact();
    }


    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        return userRepository.findByEmailId(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
