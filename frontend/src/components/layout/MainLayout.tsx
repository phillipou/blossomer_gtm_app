import SidebarNav from "../navigation/SidebarNav";
import Navbar from "./Navbar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthState } from '../../lib/auth';
import { useEffect } from 'react';

export default function MainLayout() {
  const authState = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.loading) return; // Wait for auth state to resolve
    const isAppRoute = location.pathname.startsWith('/app');
    const isPlaygroundRoute = location.pathname.startsWith('/playground');
    
    console.log('🔍 [MainLayout] Current path:', location.pathname);
    console.log('🔍 [MainLayout] Has token:', !!authState.token);
    console.log('🔍 [MainLayout] Is app route:', isAppRoute);
    console.log('🔍 [MainLayout] Is playground route:', isPlaygroundRoute);
    
    if (isAppRoute && !authState.token) {
      // Unauthenticated user trying to access /app
      console.log('🔍 [MainLayout] Redirecting to auth (no token for app route)');
      navigate('/auth?mode=signin', { replace: true });
    } else if (isPlaygroundRoute && authState.token) {
      // Authenticated user trying to access /playground
      // Redirect to /app/company (could enhance to /app/company/:id if available)
      console.log('🔍 [MainLayout] Redirecting to /app/company (authenticated user on playground)');
      navigate('/app/company', { replace: true });
    }
  }, [authState.token, authState.loading, location.pathname, navigate]);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar maxWidthClass="" />
      {/* Layout: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0">
        <SidebarNav />
        <main className="flex-1 min-h-0 bg-gray-50"><Outlet /></main>
      </div>
    </div>
  );
} 