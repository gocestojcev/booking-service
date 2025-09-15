// User Context Service
// This integrates with the real authentication system

export interface User {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
}

// Global variable to store the current user
let currentUser: User | null = null;

export const userContext = {
  // Set the current user (called from AuthContext)
  setCurrentUser: (user: User | null): void => {
    currentUser = user;
    console.log('User context updated:', user);
  },

  // Get current logged-in user
  getCurrentUser: (): User => {
    if (!currentUser) {
      // Fallback to mock user if no real user is set
      console.warn('No authenticated user found, using fallback');
      return {
        id: 'user1',
        name: 'System User',
        email: 'system@vilathomas.com',
        companyId: 'comp1',
        role: 'admin'
      };
    }
    return currentUser;
  },

  // Get user's company ID
  getUserCompanyId: (): string => {
    return currentUser?.companyId || 'comp1';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return currentUser !== null;
  },

  // Get user's role
  getUserRole: (): string => {
    return currentUser?.role || 'admin';
  },

  // Logout function
  logout: (): void => {
    currentUser = null;
    console.log('User logged out');
    // Redirect to login page
    window.location.href = '/login';
  }
};

export default userContext;
