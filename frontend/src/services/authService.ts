import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession, fetchUserAttributes, confirmResetPassword, confirmSignIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

export interface AuthUser {
  username: string;
  email: string;
  attributes: {
    email: string;
    name?: string;
    'custom:company_id'?: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpData {
  username: string;
  password: string;
  email: string;
  name?: string;
  companyId?: string;
}

class AuthService {
  async signIn(credentials: LoginCredentials): Promise<any> {
    try {
      console.log('Attempting sign in with username:', credentials.username);
      const user = await signIn({
        username: credentials.username,
        password: credentials.password
      });
      console.log('Sign in successful:', user);
      
      // Check if user needs to change password
      if (user.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        console.log('User needs to change password');
        // Return the challenge information instead of throwing an error
        return {
          ...user,
          challengeName: 'NEW_PASSWORD_REQUIRED',
          challengeParameters: {},
          session: '' // We'll get the session from the challenge response
        };
      }
      
      // Verify the session is established
      try {
        const session = await fetchAuthSession();
        console.log('Session established:', !!session);
      } catch (sessionError) {
        console.error('Session verification failed:', sessionError);
      }
      
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async confirmNewPassword(username: string, newPassword: string, session: string): Promise<any> {
    try {
      console.log('Confirming new password for user:', username);
      const result = await confirmSignIn({
        challengeResponse: newPassword
      });
      console.log('New password confirmed successfully:', result);
      return result;
    } catch (error) {
      console.error('Confirm new password error:', error);
      throw error;
    }
  }

  async signUp(signUpData: SignUpData): Promise<any> {
    try {
      const { username, password, email, name, companyId } = signUpData;
      
      const attributes = {
        email,
        ...(name && { name }),
        ...(companyId && { 'custom:company_id': companyId }),
      };

      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: attributes,
        }
      });

      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async confirmSignUp(username: string, code: string): Promise<string> {
    try {
      await confirmSignUp({
        username,
        confirmationCode: code
      });
      return 'User confirmed successfully';
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('Getting current user...');
      const user = await getCurrentUser();
      console.log('Raw user object:', user);
      
      const attributes = await fetchUserAttributes();
      console.log('User attributes:', attributes);
      
      const authUser = {
        username: user.username,
        email: attributes.email || user.signInDetails?.loginId || '',
        attributes: {
          email: attributes.email || user.signInDetails?.loginId || '',
          name: attributes.name || attributes.email || user.signInDetails?.loginId || '',
        },
      };
      
      console.log('Formatted auth user:', authUser);
      return authUser;
    } catch (error) {
      console.log('No authenticated user:', error);
      return null;
    }
  }

  async getCurrentSession(): Promise<any> {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      console.log('No current session');
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      return session?.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('Checking if authenticated...');
      const session = await fetchAuthSession();
      console.log('Session:', session);
      
      // Check if session and tokens exist
      if (!session?.tokens?.accessToken) {
        console.log('No access token found');
        return false;
      }
      
      // Check if token is expired
      const accessToken = session.tokens.accessToken;
      const payload = accessToken.payload;
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token is expired, exp:', new Date(payload.exp * 1000), 'current:', new Date());
        return false;
      }
      
      const user = await getCurrentUser();
      console.log('User for auth check:', user);
      return !!user;
    } catch (error) {
      console.log('Not authenticated:', error);
      return false;
    }
  }

  async refreshSession(): Promise<any> {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
