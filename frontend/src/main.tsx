import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
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
import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Textarea } from './components/ui/textarea'
import { Building2, Users, TrendingUp, Edit3, Check, X, Bell, Home, Settings, Sparkles, ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react'

// Dummy auth check (replace with real logic later)
const isAuthenticated = false

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StagewiseToolbar />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="target-accounts" element={<Accounts />} />
          <Route path="target-accounts/:id" element={<AccountDetail />} />
          <Route path="target-accounts/:id/personas/:personaId" element={<PersonaDetail />} />
          <Route path="target-personas" element={<Personas />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
