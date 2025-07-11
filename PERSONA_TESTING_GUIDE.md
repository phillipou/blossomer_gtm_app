# Persona PUT Pipeline Testing Guide

## Overview
This guide provides step-by-step manual testing instructions for the newly implemented Persona PUT pipeline patterns. These tests validate that field preservation, cache management, and component state synchronization work correctly.

## Pre-Testing Setup

### 1. Open Browser DevTools
- Open Chrome/Edge DevTools (F12)
- Go to **Console** tab to monitor logs
- Go to **Network** tab to monitor API requests
- Keep DevTools open throughout testing

### 2. Navigate to Persona Detail Page
```
http://localhost:3000/accounts/{accountId}/personas/{personaId}
```
Replace `{accountId}` and `{personaId}` with actual IDs from your system.

## Core Testing Scenarios

### Test 1: Demographics Update (Field Preservation)
**Purpose:** Verify complex field structures are preserved during updates

#### Steps:
1. **Initial State Check**
   - Look for console log: `[STATE-SYNC-TEST] component-mount-or-update synchronization check`
   - Look for console log: `[CACHE-TEST] Testing persona cache invalidation and refresh patterns`

2. **Open Demographics Modal**
   - Hover over Demographics card
   - Click the pencil (edit) icon that appears
   - Modal should open with existing demographics data

3. **Make Changes**
   - Add a new job title (e.g., "Senior Engineer")
   - Add a new department (e.g., "DevOps")
   - Click Save

4. **Verify Console Logs** (Critical validation):
   ```
   [COMPONENT-UPDATE] Demographics update initiated
   [HOOK-PRESERVE] useUpdatePersonaPreserveFields entry
   [FIXED-MERGE] mergePersonaUpdates ENTRY
   [UPDATE-PERSONA] API boundary transformation
   [NORMALIZE] Normalized persona (single format)
   [CACHE-VALIDATION] Persona cache state
   ```

5. **Expected Behavior:**
   - Modal closes immediately
   - Demographics table updates with new values
   - No page refresh required
   - All other persona fields remain unchanged

### Test 2: Buying Signals Update (Complex Array Management)
**Purpose:** Test array field preservation and cache consistency

#### Steps:
1. **Add New Buying Signal**
   - Click "Add" button in Buying Signals section
   - Fill in all fields:
     - Title: "Increased hiring in engineering"
     - Description: "Company posting multiple engineering roles"
     - Priority: "High"
     - Type: "Hiring Signal"
     - Detection Method: "Job board monitoring"
   - Click Save

2. **Monitor Console for:**
   ```
   [COMPONENT-UPDATE] Buying signals update initiated
   [FIXED-MERGE] Field separation complete
   [CRITICAL] Should NOT see: "Recursive data field detected"
   ```

3. **Edit Existing Signal**
   - Click edit on any existing buying signal
   - Change priority from "Medium" to "High"
   - Click Save

4. **Expected Behavior:**
   - New signal appears immediately
   - Edit updates without affecting other signals
   - All other persona data preserved

### Test 3: Use Cases Update (Nested Object Preservation)
**Purpose:** Verify complex nested objects maintain structure

#### Steps:
1. **Add New Use Case**
   - Scroll to Use Cases section
   - Click "Add Use Case"
   - Fill in all four fields:
     - Use Case: "API Monitoring"
     - Pain Points: "Manual monitoring is time-consuming"
     - Capability: "Automated alerting system"
     - Desired Outcome: "Reduced downtime, faster response"
   - Click Save

2. **Critical Console Validation:**
   ```
   [FIXED-MERGE] hasComplexFields: true
   [UPDATE-PERSONA] formatConsistent: true
   [CACHE-VALIDATION] hasComplexFields: true
   ```

3. **Edit Existing Use Case**
   - Click edit on existing use case
   - Modify the "Desired Outcome" field
   - Click Save

### Test 4: Overview Update (Name/Description Fields)
**Purpose:** Test basic field updates with field preservation

#### Steps:
1. **Edit Overview**
   - Click edit icon on Overview card
   - Change persona name (e.g., "Senior DevOps Engineer")
   - Modify description slightly
   - Click Save

2. **Verify Logs Show:**
   ```
   [HOOK-PRESERVE] field-level-merge
   [FIXED-MERGE] topLevelName: [new name]
   [UPDATE-PERSONA] Backend payload
   ```

## Cache Consistency Tests

### Test 5: Browser Refresh Validation
**Purpose:** Ensure cache persistence across page reloads

#### Steps:
1. **Make Any Update** (demographics, buying signals, etc.)
2. **Wait for Success** (modal closes, UI updates)
3. **Refresh Browser** (Ctrl+R or F5)
4. **Verify:** All changes persist after refresh
5. **Check Console:** Should see cache being populated, not API calls

### Test 6: Navigation Test
**Purpose:** Test cache when navigating away and back

#### Steps:
1. **Make Updates** to persona
2. **Navigate Away** (click breadcrumb to go to Account detail)
3. **Navigate Back** to persona detail
4. **Verify:** All changes still visible
5. **Monitor Network Tab:** Should see minimal API requests

## Error Scenario Testing

### Test 7: Network Failure Simulation
**Purpose:** Test error handling and retry logic

#### Steps:
1. **Open Network Tab** in DevTools
2. **Throttle Connection** (Bottom right → "No throttling" → "Slow 3G")
3. **Make Updates** to demographics or buying signals
4. **Watch for:**
   - Loading states in UI
   - Error handling in console
   - Proper error messages to user

### Test 8: Invalid Data Validation
**Purpose:** Ensure assertions catch data corruption

#### Steps:
1. **Look for Assertion Logs:**
   ```
   [CRITICAL] Should NEVER see: "Recursive data field detected"
   [CRITICAL] Should NEVER see: "Backend returned recursive data structure"
   ```

2. **If You See These Errors:** STOP TESTING - Critical bug detected

## Success Criteria Checklist

### ✅ Field Preservation
- [ ] Demographics updates preserve all other persona fields
- [ ] Buying signals updates preserve all other persona fields  
- [ ] Use cases updates preserve all other persona fields
- [ ] Overview updates preserve complex fields (demographics, etc.)

### ✅ Cache Consistency
- [ ] UI updates immediately without page refresh
- [ ] Browser refresh shows persisted changes
- [ ] Navigation away/back maintains changes
- [ ] Console shows `[CACHE-VALIDATION]` logs

### ✅ Data Integrity
- [ ] No recursive nesting errors in console
- [ ] No field deletion/corruption
- [ ] Complex structures (arrays, objects) maintained
- [ ] Proper camelCase format throughout

### ✅ Error Handling
- [ ] Network errors handled gracefully
- [ ] Loading states work properly
- [ ] User gets feedback on save success/failure

## Debugging Red Flags

### 🚨 STOP TESTING IF YOU SEE:
```
[CRITICAL] Recursive data field detected
[CRITICAL] Backend returned recursive data structure
[ROOTCAUSE-ISSUE4] NESTED data field
```

### ⚠️ Investigate If You See:
```
[MERGE-WARNING] currentPersona undefined
[NORMALIZE] NESTED data field detected
Error: Field preservation failed
```

### ✅ Good Signs:
```
[FIXED-MERGE] Field separation complete
[CACHE-VALIDATION] Persona cache state
[HOOK-PRESERVE] useUpdatePersonaPreserveFields success
[UPDATE-PERSONA] formatConsistent: true
```

## Performance Validation

### Expected Response Times:
- **Demographics Update:** < 2 seconds
- **Buying Signals Update:** < 2 seconds  
- **Use Cases Update:** < 2 seconds
- **Cache Updates:** < 100ms (instant UI feedback)

### Network Requests:
- **Should See:** 1 PUT request per update operation
- **Should NOT See:** Multiple PUT requests for single operation
- **Should NOT See:** Excessive GET requests after updates

## Completion Report

After testing, verify you can answer "YES" to:

1. **Field Preservation:** All persona fields preserved during partial updates?
2. **Cache Consistency:** UI reflects changes without page refresh?
3. **Data Integrity:** No recursive nesting or field corruption?
4. **Error Handling:** Graceful handling of network issues?
5. **Performance:** Updates complete within expected timeframes?

If any answer is "NO" - document the specific issue and stop testing for developer investigation.