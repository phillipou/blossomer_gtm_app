import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './App.css'
import LandingPage from './pages/LandingPage'
import Company from './pages/Company'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import PersonaDetail from './pages/PersonaDetail'
import Personas from './pages/Personas'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import AccountSettings from './pages/AccountSettings'
import MainLayout from './components/layout/MainLayout'
import NavbarOnlyLayout from "./components/layout/NavbarOnlyLayout";
import { NeonAuthWrapper } from './components/auth/NeonAuthWrapper'
import { Auth } from './pages/Auth'
import { AuthError } from './pages/AuthError'
import { OAuthCallback } from './components/auth/OAuthCallback'
// Stagewise import
import { StagewiseToolbar } from '@stagewise/toolbar-react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StagewiseToolbar />
    <NeonAuthWrapper>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<NavbarOnlyLayout />}>
            <Route path="auth" element={<Auth />} />
            <Route path="handler/error" element={<AuthError />} />
            <Route path="handler/oauth-callback" element={<OAuthCallback />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="company" element={<Company />} />
            <Route path="target-accounts" element={<Accounts />} />
            <Route path="target-accounts/:id" element={<AccountDetail />} />
            <Route path="target-accounts/:id/personas/:personaId" element={<PersonaDetail />} />
            <Route path="target-personas" element={<Personas />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
            <Route path="account-settings" element={<AccountSettings />} />
            {/* Add other routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </NeonAuthWrapper>
  </StrictMode>,
)
