# Superset Dashboard Loading Issues - Fixes & Solutions

## Problem Summary
The application was experiencing issues with loading Superset dashboards:
- ✅ **Iframe + Numeric ID (1)**: Working
- ✅ **Iframe + UUID**: Working  
- ❌ **SDK + Numeric ID (1)**: Not loading
- ❌ **SDK + UUID**: Not loading

## Root Causes Identified

### 1. SDK Version Compatibility
- **Old Version**: `@superset-ui/embedded-sdk` ^0.1.3
- **Issue**: Outdated SDK with compatibility problems
- **Solution**: Updated to ^0.2.0

### 2. SDK Import Issues
- **Problem**: `embedDashboard` function not properly available
- **Symptoms**: "embedDashboard function not available" errors
- **Solution**: Added fallback to `window.embedDashboard`

### 3. Container Initialization
- **Problem**: Containers not ready when SDK tries to mount
- **Solution**: Added proper container validation and fallback containers

### 4. Error Handling
- **Problem**: Poor error reporting made debugging difficult
- **Solution**: Added comprehensive error handling and status updates

## Fixes Implemented

### 1. Package Update
```bash
cd frontend
npm install @superset-ui/embedded-sdk@^0.2.0
```

### 2. SDK Fallback Mechanism
```javascript
// Check if SDK is available - try both imported and window versions
let sdkFunction = embedDashboard;
if (typeof sdkFunction !== 'function') {
    sdkFunction = window.embedDashboard;
}

if (typeof sdkFunction !== 'function') {
    throw new Error('embedDashboard function not available - SDK may not be properly imported or loaded');
}
```

### 3. Improved Container Validation
```javascript
// Ensure container is properly set up
if (!container || !container.id) {
    throw new Error('Container not properly initialized for SDK approach');
}
```

### 4. Enhanced Iframe Approach
- Added UUID vs Numeric ID detection
- Multiple URL format attempts
- Better cross-origin handling
- Longer loading timeouts

### 5. Real-time Status Updates
- Added status display for each dashboard approach
- Color-coded success/failure indicators
- Detailed error messages

## Testing & Debugging

### 1. Run Comprehensive Test
Click the "Test All Approaches" button to run individual tests for each approach.

### 2. Check Console Logs
Monitor the browser console for detailed error messages and debugging information.

### 3. Use Debug Script
Run the `test_dashboard_loading.js` script in the browser console for additional diagnostics.

### 4. Monitor Status Panel
Watch the "Dashboard Status Summary" panel for real-time updates on each approach.

## Troubleshooting Steps

### If SDK Still Not Working:

1. **Check SDK Import**:
   ```javascript
   console.log('SDK Status:', typeof embedDashboard === 'function');
   console.log('Window SDK:', typeof window.embedDashboard === 'function');
   ```

2. **Verify Container Ready**:
   ```javascript
   const container = document.getElementById('dashboard-sdk-numeric');
   console.log('Container:', container);
   ```

3. **Check Superset Connection**:
   ```javascript
   fetch('http://localhost:8088/superset/dashboard/1/')
       .then(r => console.log('Status:', r.status))
       .catch(e => console.error('Error:', e));
   ```

### If Iframe Not Working:

1. **Check Token Generation**:
   - Verify backend `/brands/{brandId}/reports/iframe` endpoint
   - Check token expiration (5 minutes)
   - Verify Superset secret key matches

2. **Check Superset Configuration**:
   - Verify `GUEST_TOKEN_JWT_SECRET` in superset_config.py
   - Check CORS settings
   - Verify embedded dashboard feature flags

## Expected Behavior After Fixes

- **SDK + Numeric ID**: Should load dashboard using Superset SDK
- **SDK + UUID**: Should load dashboard using Superset SDK  
- **Iframe + Numeric ID**: Should load dashboard in iframe
- **Iframe + UUID**: Should load dashboard in iframe

## Fallback Strategy

If SDK fails, the system automatically falls back to iframe approach for better reliability.

## Monitoring

- Watch the debug info panel for real-time status
- Monitor browser console for detailed error logs
- Use the status summary panel to track each approach
- Check network tab for failed requests

## Next Steps

1. Test the updated implementation
2. Monitor for any remaining issues
3. Consider upgrading to latest Superset SDK version if problems persist
4. Implement additional error recovery mechanisms if needed
