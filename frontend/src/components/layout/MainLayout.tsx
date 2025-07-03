import SidebarNav from "../navigation/SidebarNav";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";
import React from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header (copied from LandingPage) */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Blossomer</span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600">Sign in</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Dashboard</Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Layout: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0">
        <SidebarNav />
        <main className="flex-1 min-h-0 bg-gray-50"><Outlet /></main>
      </div>
    </div>
  );
} 