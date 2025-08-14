# Troubleshooting Superset SDK 404 Errors

## Problem Description
The SDK approach for loading Superset dashboards is getting 404 errors, while the iframe approach works fine.

## Current Status
- ✅ **Iframe + UUID**: Working
- ❌ **SDK + UUID**: Getting 404 errors

## Root Cause Analysis

### 1. Dashboard ID Mismatch
- **Backend Configuration**: Generates tokens for UUID `df2a444a-8df2-43ae-bae6-d61c4a717956`
- **Frontend Attempts**: Tries to use both numeric ID `1` and UUID
- **Issue**: The numeric ID `1` might not exist in Superset

### 2. SDK vs Iframe Differences
- **SDK Approach**: Makes direct API calls to Superset
- **Iframe Approach**: Loads the full Superset dashboard page
- **Issue**: SDK might need different authentication or endpoint handling

### 3. Superset Configuration
- **Guest Token**: Backend generates tokens for specific dashboard UUID
- **Permissions**: SDK might not have proper access to the dashboard

## Immediate Fixes Applied

### 1. Updated Dashboard IDs
```javascript
// Before: Mixed numeric and UUID
const DASHBOARD_ID = "1"; // Numeric ID
const DASHBOARD_UUID = "df2a444a-8df2-43ae-bae6-d61c4a717956";

// After: Consistent UUID usage
const DASHBOARD_ID = "df2a444a-8df2-43ae-bae6-d61c4a717956";
const DASHBOARD_UUID = "df2a444a-8df2-43ae-bae6-d61c4a717956";
```

### 2. Added Dashboard Verification
```javascript
// Verify dashboard exists before attempting SDK embedding
const dashboardCheck = await fetch(`http://localhost:8088/superset/dashboard/${dashboardId}/`, {
    method: 'HEAD',
    headers: {
        'Authorization': `Bearer ${embedToken}`
    }
});

if (!dashboardCheck.ok) {
    throw new Error(`Dashboard ${dashboardId} not accessible (Status: ${dashboardCheck.status})`);
}
```

### 3. Added Dashboard Discovery
```javascript
// Check what dashboards are actually available in Superset
const checkAvailableDashboards = async () => {
    const response = await fetch('http://localhost:8088/superset/dashboard/list/');
    // ... process response to find available dashboards
};
```

## Testing Steps

### 1. Check Available Dashboards
Click the "Check Dashboards" button to see what's actually available in Superset.

### 2. Verify Dashboard Exists
```javascript
// Run in browser console
fetch('http://localhost:8088/superset/dashboard/df2a444a-8df2-43ae-bae6-d61c4a717956/')
    .then(r => console.log('Status:', r.status))
    .catch(e => console.error('Error:', e));
```

### 3. Test Token Access
```javascript
// Get a token and test access
const token = 'your-token-here';
fetch('http://localhost:8088/superset/dashboard/df2a444a-8df2-43ae-bae6-d61c4a717956/', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

## Common 404 Causes

### 1. Dashboard Doesn't Exist
- **Symptom**: 404 error on dashboard access
- **Solution**: Verify dashboard exists in Superset admin

### 2. Permission Issues
- **Symptom**: 404 or 403 errors
- **Solution**: Check guest token permissions and RLS rules

### 3. Wrong Endpoint
- **Symptom**: 404 on API calls
- **Solution**: Verify Superset API endpoints

### 4. Token Expiration
- **Symptom**: 401/403 errors
- **Solution**: Check token expiration (5 minutes)

## Debugging Commands

### Check Superset Status
```bash
# Check if Superset is running
curl http://localhost:8088/superset/health

# Check dashboard list
curl http://localhost:8088/superset/dashboard/list/
```

### Check Backend Token Generation
```bash
# Test token endpoint
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     http://localhost:8080/api/brands/YOUR_BRAND_ID/reports/iframe
```

### Check Frontend SDK
```javascript
// In browser console
console.log('SDK Status:', typeof embedDashboard === 'function');
console.log('Window SDK:', typeof window.embedDashboard === 'function');
```

## Expected Behavior After Fixes

1. **Dashboard Verification**: Should confirm dashboard exists before SDK attempt
2. **Consistent IDs**: All approaches use the same UUID
3. **Better Error Messages**: Clear indication of what's failing
4. **Fallback Strategy**: Iframe approach works as backup

## Next Steps

1. **Test the Updated Implementation**
   - Use "Check Dashboards" button
   - Monitor debug info for specific error messages
   - Check browser console for detailed logs

2. **Verify Superset Setup**
   - Confirm dashboard exists with UUID
   - Check guest token configuration
   - Verify CORS and security settings

3. **Monitor SDK Behavior**
   - Watch for 404 vs other error types
   - Check if dashboard verification passes
   - Monitor SDK initialization

## If 404 Persists

1. **Check Superset Logs**: Look for access denied or not found errors
2. **Verify Dashboard UUID**: Ensure it matches what's in Superset
3. **Test Token Permissions**: Verify guest token has access to dashboard
4. **Check API Endpoints**: Ensure Superset API is accessible
5. **Consider Alternative**: Use iframe approach as primary method
