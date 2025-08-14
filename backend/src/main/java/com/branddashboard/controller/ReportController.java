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

@RestController
@RequestMapping("/api/brands/{brandId}/reports")
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    @Value("${superset.guest_token.secret}")
    private String supersetSecret;

    private static final String SUPERSET_DASHBOARD_ID = "938de2fd-883a-4107-86a9-d5a030e1209f"; // Replace with your actual dashboard UUID

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
