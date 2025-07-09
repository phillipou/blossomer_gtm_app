import React from 'react';
import { useUser } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const AccountSettings: React.FC = () => {
  const user = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (!user) return;
    try {
      await user.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await user.delete();
        navigate('/');
      } catch (error) {
        console.error('Account deletion failed:', error);
        alert('Failed to delete account. Please try again or contact support.');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Not signed in</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to access account settings.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and security</p>
        </div>

        <div className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-gray-900">{user.primaryEmail || 'No email set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <div className="text-gray-900">{user.displayName || 'No display name set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <div className="text-gray-500 text-sm font-mono">{user.id}</div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account security and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Sign Out</h3>
                  <p className="text-sm text-gray-600">Sign out of your account on this device</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h3 className="font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-700">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-start">
            <Button variant="outline" onClick={() => navigate('/company')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
    </div>
  );
};

export default AccountSettings;