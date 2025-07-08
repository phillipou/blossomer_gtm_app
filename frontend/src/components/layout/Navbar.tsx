import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";
import React from "react";

interface NavbarProps {
  maxWidthClass?: string; // e.g., 'max-w-7xl mx-auto' or ''
}

const Navbar: React.FC<NavbarProps> = ({ maxWidthClass = "" }) => {
  const navigate = useNavigate();
  const user = useUser();

  const handleSignOut = async () => {
    if (user) {
      await user.signOut();
      navigate('/auth?mode=signin');
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
              aria-label="Go to home"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
                <img src="/blossomer-logo.png" alt="Blossomer Logo" className="w-10 h-10" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Blossomer</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg" onClick={() => navigate('/company')}>Dashboard</Button>
            {user ? (
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-800 focus:outline-none bg-transparent border-none shadow-none"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-800 focus:outline-none bg-transparent border-none shadow-none"
                onClick={() => navigate('/auth?mode=signin')}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 