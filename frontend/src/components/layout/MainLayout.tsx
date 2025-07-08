import SidebarNav from "../navigation/SidebarNav";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

export default function MainLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header (copied from LandingPage) */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                type="button"
                className="flex items-center space-x-2 focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                aria-label="Go to home"
                onClick={() => navigate("/")}
              >
                <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
                  <img src="/blossomer-logo.png" alt="Blossomer Logo" className="w-10 h-10" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Blossomer</span>
              </button>
              <div className="hidden md:flex items-center space-x-6">
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600">Sign in</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Company</Button>
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