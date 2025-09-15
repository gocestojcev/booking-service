import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService, AuthUser } from '../services/authService';
import { userContext } from '../services/userContext';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('Refreshing user...');
      const currentUser = await authService.getCurrentUser();
      console.log('Current user from authService:', currentUser);
      setUser(currentUser);
      
      // Update userContext with the authenticated user
      if (currentUser) {
        const userContextData = {
          id: currentUser.username,
          name: currentUser.attributes.name || currentUser.email,
          email: currentUser.email,
          companyId: 'comp1', // For now, hardcode to comp1 - in real app this would come from user attributes
          role: 'admin' // For now, hardcode to admin - in real app this would come from user attributes
        };
        userContext.setCurrentUser(userContextData);
      } else {
        userContext.setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      userContext.setCurrentUser(null);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Starting login process...');
      const signInResult = await authService.signIn({ username, password });
      console.log('Sign in result:', signInResult);
      
      // Add a small delay to ensure the session is properly established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await refreshUser();
      console.log('User refreshed after login');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      userContext.setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing auth...');
        await refreshUser();
        console.log('Auth initialization complete');
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic token validation
  useEffect(() => {
    if (!user) return;

    const validateTokenPeriodically = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          console.log('Token expired or invalid, logging out...');
          await logout();
        }
      } catch (error) {
        console.error('Token validation error:', error);
        await logout();
      }
    };

    // Check token validity every 5 minutes
    const interval = setInterval(validateTokenPeriodically, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  // Debug user state changes
  useEffect(() => {
    console.log('User state changed:', { user, isAuthenticated: !!user, isLoading });
  }, [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
