import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userContext } from '../services/userContext';
import { authService } from '../services/authService';
import { apiService, Hotel } from '../services/api';
import Login from './Login';
import CalendarComponent from './Calendar';
import Reports from './Reports';
import './AuthenticatedApp.css';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'calendar' | 'reports'>('calendar');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');

  console.log('AuthenticatedApp render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);

  // Load hotels on component mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        console.log('Loading hotels...');
        const hotelsData = await apiService.getHotels();
        console.log('Loaded hotels:', hotelsData);
        setHotels(hotelsData);
        
        if (hotelsData.length > 0) {
          const firstHotel = hotelsData[0];
          const hotelId = firstHotel.PK.replace('LOCATION#', '');
          console.log('Setting selected hotel:', hotelId);
          setSelectedHotel(hotelId);
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
      }
    };

    if (isAuthenticated) {
      loadHotels();
    }
  }, [isAuthenticated]);

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
            <div className="header-left">
              {currentView === 'calendar' && hotels.length > 0 && (
                <div className="header-hotel-selector">
                  <select
                    id="header-hotel-select"
                    value={selectedHotel}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    className="header-hotel-dropdown"
                  >
                    {hotels.map((hotel) => (
                      <option key={hotel.PK} value={hotel.PK.replace('LOCATION#', '')}>
                        {hotel.Name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
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
        {currentView === 'calendar' ? (
          <CalendarComponent 
            selectedHotel={selectedHotel}
            onHotelChange={setSelectedHotel}
            hotels={hotels}
          />
        ) : (
          <Reports />
        )}
      </main>
    </div>
  );
};

export default AuthenticatedApp;
