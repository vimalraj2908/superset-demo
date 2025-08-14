package com.branddashboard.controller;

import com.branddashboard.dto.EmbedTokenResponse;
import com.branddashboard.model.User;
import com.branddashboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Arrays;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import javax.crypto.spec.SecretKeySpec;
import java.security.Key;

@RestController
@RequestMapping("/api/brands/{brandId}/reports")
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    @Value("${superset.api_key}")
    private String supersetApiKey;

    @Value("${superset.url}")
    private String supersetUrl;

    @Value("${superset.dashboard.id}")
    private String supersetDashboardId;

    @Value("${superset.guest_token.secret}")
    private String guestTokenSecret;

    @GetMapping("/superset-iframe")
    public ResponseEntity<EmbedTokenResponse> getSupersetIframe(@PathVariable String brandId) {
        User user = getCurrentUser();
        if (user.getBrandIds().contains(brandId)) {
            try {
                String url = generateSupersetEmbedUrl(brandId, user);
                return ResponseEntity.ok(new EmbedTokenResponse(url));
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).build();
            }
        } else {
            return ResponseEntity.status(403).build(); // Forbidden
        }
    }

    @GetMapping("/iframe")
    public ResponseEntity<EmbedTokenResponse> getIframe(@PathVariable String brandId) {
        System.out.println("🔍 /iframe endpoint called for brandId: " + brandId);
        User user = getCurrentUser();
        System.out.println("👤 Current user: " + user.getEmailId() + " with brandIds: " + user.getBrandIds());
        
        if (user.getBrandIds().contains(brandId)) {
            try {
                String url = generateSupersetEmbedUrl(brandId, user);
                System.out.println("✅ Generated URL for brand " + brandId + ": " + url);
                return ResponseEntity.ok(new EmbedTokenResponse(url));
            } catch (Exception e) {
                System.err.println("❌ Error generating URL: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).build();
            }
        } else {
            System.err.println("❌ User " + user.getEmailId() + " not authorized for brand " + brandId);
            System.err.println("User's brands: " + user.getBrandIds());
            System.err.println("Requested brand: " + brandId);
            return ResponseEntity.status(403).build(); // Forbidden
        }
    }

    @GetMapping("/dashboards")
    public ResponseEntity<?> getAvailableDashboards(@PathVariable String brandId) {
        System.out.println("🔍 /dashboards endpoint called for brandId: " + brandId);
        User user = getCurrentUser();
        System.out.println("👤 Current user: " + user.getEmailId() + " with brandIds: " + user.getBrandIds());
        
        if (user.getBrandIds().contains(brandId)) {
            try {
                // Return dashboard info that matches our configuration
                Map<String, Object> dashboard = new HashMap<>();
                dashboard.put("id", 1);
                dashboard.put("uuid", "0a7d4b2a-23c9-4789-9229-a4e1e727902a");
                dashboard.put("dashboard_title", "Brand Performance Dashboard");
                dashboard.put("url", supersetUrl + "/superset/dashboard/1/");
                
                List<Map<String, Object>> dashboards = Arrays.asList(dashboard);
                System.out.println("✅ Returning " + dashboards.size() + " dashboards for brand " + brandId);
                return ResponseEntity.ok(dashboards);
            } catch (Exception e) {
                System.err.println("❌ Error getting dashboards: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).build();
            }
        } else {
            System.err.println("❌ User " + user.getEmailId() + " not authorized for brand " + brandId);
            return ResponseEntity.status(403).build(); // Forbidden
        }
    }

    private String generateSupersetEmbedUrl(String brandId, User user) throws Exception {
        // Generate guest token for Superset embedding
        String guestToken = generateSupersetGuestToken(user, brandId);
        
        // Return just the guest token, not the full URL
        // The frontend will construct the URL with the token
        
        // Log the generated token for debugging
        System.out.println("Generated Guest Token: " + guestToken.substring(0, Math.min(50, guestToken.length())) + "...");
        System.out.println("Superset URL from config: " + supersetUrl);
        System.out.println("Dashboard ID from config: " + supersetDashboardId);
        
        return guestToken;
    }

    private String generateSupersetGuestToken(User user, String brandId) throws Exception {
        try {
            // Create a proper Superset guest token
            // Superset expects guest tokens in a specific format with user info and permissions
            
            // Create token payload with required fields
            Map<String, Object> payload = new HashMap<>();
            payload.put("user", user.getEmailId());
            payload.put("user_id", user.getId());
            payload.put("org_id", 1);
            payload.put("exp", Instant.now().getEpochSecond() + 3600); // 1 hour expiration
            payload.put("iat", Instant.now().getEpochSecond()); // issued at
            
            // Add permissions for dashboard access
            Map<String, Object> resources = new HashMap<>();
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("type", "dashboard");
            dashboard.put("id", supersetDashboardId);
            
            // Also add the numeric ID if this is a UUID
            if (supersetDashboardId.contains("-")) {
                // This is a UUID, try to extract numeric ID from the existing dashboard
                dashboard.put("id", 1); // Use the numeric ID we know exists
            }
            
            List<Map<String, Object>> dashboards = Arrays.asList(dashboard);
            resources.put("dashboards", dashboards);
            
            // Add filters for brand-specific data
            Map<String, Object> filters = new HashMap<>();
            filters.put("brand_id", Arrays.asList(brandId));
            
            payload.put("resources", resources);
            payload.put("filters", filters);
            
            // Convert to JSON and encode
            ObjectMapper mapper = new ObjectMapper();
            String jsonPayload = mapper.writeValueAsString(payload);
            
            // Sign the payload with JWT using the guest token secret
            // This creates a proper Superset guest token
            Key key = new SecretKeySpec(guestTokenSecret.getBytes(), SignatureAlgorithm.HS256.getJcaName());
            String jwtToken = Jwts.builder()
                .setPayload(jsonPayload)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
            
            return jwtToken;
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate guest token", e);
        }
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        return userRepository.findByEmailId(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
