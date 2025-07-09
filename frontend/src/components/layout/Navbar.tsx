import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@stackframe/react";
import React, { useEffect } from "react";
import { useAuthState } from '../../lib/auth';
import { useGetCompanies } from '../../lib/hooks/useCompany';

interface NavbarProps {
  maxWidthClass?: string; // e.g., 'max-w-7xl mx-auto' or ''
}

const Navbar: React.FC<NavbarProps> = ({ maxWidthClass = "" }) => {
  const navigate = useNavigate();
  const user = useUser();
  const authState = useAuthState();
  const { data: companies } = useGetCompanies(authState.token);

  useEffect(() => {
    console.log('Navbar AuthState:', authState);
  }, [authState]);

  const handleLogoClick = () => {
    if (user && companies && companies.length > 0) {
      navigate(`/app/company/${companies[companies.length - 1].id}`);
    } else if (user) {
      navigate('/app/company');
    } else {
      navigate('/');
    }
  };

  const handleDashboardClick = () => {
    if (user && companies && companies.length > 0) {
      navigate(`/app/company/${companies[companies.length - 1].id}`);
    } else if (user) {
      navigate('/app/company');
    } else {
      navigate('/playground/company');
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
              // Authenticated: Show Dashboard (primary CTA) and UserButton
              <>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg" 
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </Button>
                <UserButton />
              </>
            ) : (
              // Not authenticated: Show Sign Up (primary CTA)
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Sign up
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 