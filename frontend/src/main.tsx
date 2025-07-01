import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './App.css'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import CustomersList from './pages/CustomersList'
import CustomerDetail from './pages/CustomerDetail'
import PersonaDetail from './pages/PersonaDetail'
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
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<CustomersList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="customers/:id/persona/:personaId" element={<PersonaDetail />} />
                {/* Add campaigns and other routes here */}
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
