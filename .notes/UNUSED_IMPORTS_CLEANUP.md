# Unused Imports Cleanup Guide

*Generated: July 5, 2025*

## Overview

This document identifies all unused imports found in the codebase and provides specific instructions for cleanup. Focus on frontend files - the backend is clean.

## Files Requiring Cleanup

### 1. `/frontend/src/main.tsx` - **HIGH PRIORITY**

**Unused imports to remove:**
- Line 1: `React` from `'react'` (only `StrictMode` is used)
- Line 3: `Outlet` from `'react-router-dom'` (never used)
- Lines 17-21: All UI component imports (unused):
  ```typescript
  import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card'
  import { Button } from './components/ui/button'
  import { Badge } from './components/ui/badge'
  import { Textarea } from './components/ui/textarea'
  import { Building2, Users, TrendingUp, Edit3, Check, X, Bell, Home, Settings, Sparkles, ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react'
  ```
- Line 24: `isAuthenticated` variable (defined but never used)

**After cleanup, imports should be:**
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

### 2. `/frontend/src/components/campaigns/EmailPreview.tsx` - **MEDIUM PRIORITY**

**Issues to fix:**
- Line 4: Remove unused imports:
  ```typescript
  import { Eye, EyeOff } from 'lucide-react'  // Remove these
  ```
- Lines 82-86: Remove unused `WizardMode` const and type
- **CRITICAL**: Line 516 calls `getNextCustomType()` but function is never defined - this will cause runtime errors

**Action needed:**
1. Remove unused icon imports
2. Remove WizardMode definitions
3. Either implement `getNextCustomType()` function or remove the call

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

- **Low Risk**: Removing unused imports from main.tsx, eslint.config.js
- **Medium Risk**: EmailPreview.tsx changes (test thoroughly)
- **High Risk**: The missing getNextCustomType() function needs immediate attention

## Estimated Time

- **Main cleanup**: 30 minutes
- **EmailPreview fixes**: 1 hour (need to implement missing function)
- **Minor cleanups**: 15 minutes
- **Testing**: 30 minutes

**Total**: ~2 hours

## Next Steps

1. Start with main.tsx cleanup
2. Address EmailPreview.tsx critical issue
3. Run validation steps
4. Complete minor cleanups
5. Update this document when complete

---

*This completes the unused imports assessment. The codebase is generally well-maintained with most issues being straightforward cleanup tasks.*