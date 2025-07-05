# Unused Imports Cleanup Guide

*Generated: July 5, 2025*

## Overview

This document identifies all unused imports found in the codebase and provides specific instructions for cleanup. Focus on frontend files - the backend is clean.

## Files Requiring Cleanup

### 1. `/frontend/src/main.tsx` - ✅ **COMPLETED**

**Status**: All unused imports have been removed successfully.

**Completed actions:**
- ✅ Removed `React` from `'react'` (kept only `StrictMode`)
- ✅ Removed unused `Outlet` from `'react-router-dom'`
- ✅ Removed all unused UI component imports (Card, Button, Badge, Textarea, Lucide icons)
- ✅ Removed unused `isAuthenticated` variable

**Current clean state:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './App.css'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import PersonaDetail from './pages/PersonaDetail'
import Personas from './pages/Personas'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import MainLayout from './components/layout/MainLayout'
// Stagewise import
import { StagewiseToolbar } from '@stagewise/toolbar-react'
```

### 2. `/frontend/src/components/campaigns/EmailPreview.tsx` - ✅ **COMPLETED**

**Status**: All critical issues have been resolved.

**Completed actions:**
- ✅ Removed unused `Eye`, `EyeOff`, `Pencil`, `LayoutGrid` imports
- ✅ Removed unused `WizardMode` const and type definitions
- ✅ **CRITICAL FIX**: Implemented missing `getNextCustomType()` function
- ✅ Removed unused `onEditComponent` prop and related functionality
- ✅ Removed unused `setEditingMode` parameter where not needed
- ✅ Cleaned up all unused variables and state

**Current clean state**: All imports are now used and the component functions correctly.

### 3. `/frontend/src/pages/Campaigns.tsx` - **LOW PRIORITY**

**Issues to fix:**
- Lines 12-43: Remove large block of commented-out mock data imports
- Clean up any other commented code blocks

### 4. `/frontend/eslint.config.js` - **LOW PRIORITY**

**Issue to fix:**
- Line 9: Remove unused import:
  ```javascript
  import { globalIgnores } from 'eslint/config'  // Remove this line
  ```

## Backend Files - ✅ CLEAN

All Python files are clean with proper import usage:
- `/backend/app/api/main.py`
- `/backend/app/api/routes/*.py`
- `/backend/app/core/*.py`
- `/backend/app/services/*.py`
- `/tests/*.py`

## Cleanup Process

### Step 1: High Priority (main.tsx)
1. Remove unused React import (keep only StrictMode)
2. Remove unused Outlet import
3. Remove all unused UI component imports (Card, Button, Badge, Textarea)
4. Remove all unused Lucide React icons
5. Remove unused isAuthenticated variable

### Step 2: Medium Priority (EmailPreview.tsx)
1. Remove Eye, EyeOff imports
2. Remove WizardMode definitions
3. **CRITICAL**: Fix getNextCustomType() function call

### Step 3: Low Priority
1. Clean up Campaigns.tsx commented code
2. Fix eslint.config.js unused import

## Validation Steps

After cleanup:
1. Run `npm run build` to ensure no build errors
2. Run `npm run typecheck` (if available) to verify TypeScript
3. Run `npm run lint` to check for linting issues
4. Test the application to ensure EmailPreview component works

## Risk Assessment

- ✅ **Completed - Low Risk**: Removed unused imports from main.tsx
- ✅ **Completed - Medium Risk**: EmailPreview.tsx changes (critical getNextCustomType() function implemented)
- **Low Risk**: eslint.config.js unused import (pending)
- **Low Risk**: Campaigns.tsx commented code cleanup (pending)

## Estimated Time

- ✅ **Main cleanup**: 30 minutes (COMPLETED)
- ✅ **EmailPreview fixes**: 1 hour (COMPLETED - implemented missing function)
- **Minor cleanups**: 15 minutes (IN PROGRESS - eslint.config.js, Campaigns.tsx pending)
- ✅ **Testing**: 30 minutes (COMPLETED - build and runtime tests passed)

**Total**: ~2 hours (75% complete)

## Next Steps

1. Start with main.tsx cleanup
2. Address EmailPreview.tsx critical issue
3. Run validation steps
4. Complete minor cleanups
5. Update this document when complete

---

*This completes the unused imports assessment. The codebase is generally well-maintained with most issues being straightforward cleanup tasks.*