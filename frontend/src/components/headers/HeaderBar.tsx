import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { AuthModal } from "../auth/AuthModal";
import { useState } from "react";

interface HeaderBarProps {
  companyName: string;
  domain?: string;
  children?: ReactNode;
}

export default function HeaderBar({ companyName, domain, children }: HeaderBarProps) {
  const { isAuthenticated, userInfo, signIn, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');

  const handleAuthSuccess = (apiKey: string, userInfo: any) => {
    signIn(apiKey, userInfo);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
          {domain && <p className="text-sm text-gray-500">{domain}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          {children}
          
          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{userInfo?.name || userInfo?.email}</span>
                {userInfo?.tier && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {userInfo.tier}
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={openLogin}>
                Sign In
              </Button>
              <Button variant="default" size="sm" onClick={openSignup}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
} 