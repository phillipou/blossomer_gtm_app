import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import MainLayout from './components/layout/MainLayout'
// Stagewise import
import { StagewiseToolbar } from '@stagewise/toolbar-react'
import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Textarea } from './components/ui/textarea'
import { FirmographicsTable } from './components/dashboard/FirmographicsTable'
import { Building2, Users, TrendingUp, Edit3, Check, X, Bell, Home, Settings, Sparkles, ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react'

// Dummy auth check (replace with real logic later)
const isAuthenticated = false

const customerData = {
  id: "1",
  title: "Technical B2B SaaS Founder-Led Startups",
  subtitle: "External Facing Name: Technical B2B SaaS Founder-Led Startups",
  description: `Early-stage, founder-led B2B software startups are driven by technical leaders who are building innovative products for business customers. These companies typically operate with lean teams and limited revenue, often relying on prioritizing product development over formalized sales processes. They frequently lack dedicated sales expertise, relying instead on the founders to lead outreach and customer discovery. Their focus is on rapidly validating product-market fit and establishing scalable, repeatable revenue systems to support future growth and fundraising.`,
  firmographics: [
    { label: "Revenue", values: [ { text: "$0-1M", color: "yellow" }, { text: "$1M-5M", color: "yellow" } ] },
    { label: "Industry", values: [ { text: "Software", color: "blue" }, { text: "Technology", color: "blue" }, { text: "Information Services", color: "blue" } ] },
    { label: "Employees", values: [ { text: "0-10", color: "red" }, { text: "10-50", color: "red" } ] },
    { label: "Geography", values: [ { text: "US", color: "gray" }, { text: "North America", color: "gray" }, { text: "EMEA", color: "gray" }, { text: "APAC", color: "gray" }, { text: "Global", color: "gray" } ] },
    { label: "Business model", values: [ { text: "B2B", color: "yellow" }, { text: "SaaS", color: "blue" } ] },
  ],
  buyingSignals: [
    "Recently raised seed or Series A funding",
    "Hiring for sales or marketing roles",
    "Posting about customer acquisition challenges on social media",
    "Attending sales and marketing conferences",
    "Implementing new CRM or sales tools",
    "Founder actively networking and seeking sales advice",
    "Company showing rapid user growth but struggling with monetization",
    "Recent product launches or feature announcements",
  ],
  createdAt: "Jul 1, 2025",
  updatedAt: "Jul 1, 2025",
  creator: "Phil Ou",
};

function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("accounts");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header and sidebar removed; only render main content */}
      {/* Header Bar and SidebarNav are now provided by MainLayout */}
      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`py-4 border-b-2 font-medium ${activeTab === "accounts" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("personas")}
            className={`py-4 border-b-2 font-medium ${activeTab === "personas" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Personas
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Description Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Description</span>
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => handleEdit("description", customerData.description)}>
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {editingBlock === "description" ? (
              <div className="space-y-4">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{customerData.description}</p>
            )}
          </CardContent>
        </Card>
        {/* Firmographics Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Firmographics</CardTitle>
            <Button size="sm" variant="ghost">
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <FirmographicsTable data={customerData.firmographics} />
          </CardContent>
        </Card>
        {/* Buying Signals Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Buying Signals</CardTitle>
            <Button size="sm" variant="ghost">
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {customerData.buyingSignals.map((signal, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{signal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetailsPage />} />
                {/* Add campaigns and other routes here */}
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
