import { Button } from "../ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@stackframe/react";
import React from "react";

interface NavbarProps {
  maxWidthClass?: string; // e.g., 'max-w-7xl mx-auto' or ''
}

const Navbar: React.FC<NavbarProps> = ({ maxWidthClass = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();

  const isLandingPage = location.pathname === '/';

  const handleSignOut = async () => {
    if (user) {
      // Clear localStorage data
      localStorage.removeItem('dashboard_overview');
      localStorage.removeItem('target_accounts');
      localStorage.removeItem('emailHistory');
      
      await user.signOut();
      navigate('/');
    }
  };

  const handleLogoClick = () => {
    if (user) {
      navigate('/company');
    } else {
      navigate('/');
    }
  };
  return (
    <nav className="border-b border-gray-200">
      <div className={`${maxWidthClass} px-4 sm:px-6 lg:px-8`}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button
              type="button"
              className="flex items-center space-x-2 focus:outline-none bg-transparent border-none p-0 cursor-pointer"
              aria-label={user ? "Go to dashboard" : "Go to home"}
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
                <img src="/blossomer-logo.png" alt="Blossomer Logo" className="w-10 h-10" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Blossomer</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              // Signed in user: Show Dashboard and Sign Out
              <>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg" 
                  onClick={() => navigate('/company')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-800 focus:outline-none bg-transparent border-none shadow-none"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </>
            ) : (
              // Not signed in: Show auth button only
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                onClick={() => navigate(isLandingPage ? '/auth?mode=signup' : '/auth?mode=signin')}
              >
                {isLandingPage ? 'Sign up' : 'Sign in'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 