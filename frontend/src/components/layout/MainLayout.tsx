import SidebarNav from "../navigation/SidebarNav";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useAuthState } from '../../lib/auth';
import { useEffect } from 'react';

export default function MainLayout(props) {
  const authState = useAuthState();
  useEffect(() => {
    console.log('AuthState:', authState);
  }, [authState]);
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