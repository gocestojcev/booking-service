import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userContext } from '../services/userContext';
import { authService } from '../services/authService';
import Login from './Login';
import CalendarComponent from './Calendar';
import Reports from './Reports';
import './AuthenticatedApp.css';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'calendar' | 'reports'>('calendar');

  console.log('AuthenticatedApp render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      // Call the auth service to sign out from Cognito
      await authService.signOut();
      // Clear the user context
      userContext.logout();
      // Also call the auth context logout if available
      if (logout) {
        logout();
      }
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the local context
      userContext.logout();
    }
  };

  if (isLoading) {
    console.log('Showing loading spinner');
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing login');
    return <Login />;
  }

  return (
    <div className="authenticated-app">
        <header className="app-header">
          <div className="header-content">
            <h1 onClick={() => setCurrentView('calendar')} style={{ cursor: 'pointer' }}>Booking System</h1>
            <div className="user-menu">
            <div className="user-dropdown">
              <button className="user-dropdown-toggle">
                ☰ Menu
              </button>
              <div className="user-dropdown-content">
                <button onClick={() => setCurrentView('calendar')} className="dropdown-item">
                  Calendar
                </button>
                <button onClick={() => setCurrentView('reports')} className="dropdown-item">
                  Reports
                </button>
                <button onClick={handleLogout} className="dropdown-item">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        {currentView === 'calendar' ? <CalendarComponent /> : <Reports />}
      </main>
    </div>
  );
};

export default AuthenticatedApp;
