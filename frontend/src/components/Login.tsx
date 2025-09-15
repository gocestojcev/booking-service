import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, isLoading, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isPasswordChange, setIsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeSession, setChallengeSession] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('Form submitted!');
    console.log('Login attempt with:', formData.username);

    try {
      console.log('Calling login function...');
      const result = await authService.signIn({
        username: formData.username,
        password: formData.password
      });
      
      // Check if password change is required
      if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
        console.log('Password change required');
        setIsPasswordChange(true);
        setChallengeSession(result.session);
        return;
      }
      
      // Normal login success
      console.log('Login successful');
      
      // Refresh the user state to update authentication
      await refreshUser();
      console.log('User state refreshed after login');
      
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      console.log('Confirming new password...');
      await authService.confirmNewPassword(formData.username, newPassword, challengeSession);
      console.log('Password changed successfully');
      
      // Refresh the user state to update authentication
      await refreshUser();
      console.log('User state refreshed after password change');
      
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Password change failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (isPasswordChange) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Change Password</h1>
            <p>Please set a new password for your account</p>
          </div>
          
          <form onSubmit={handlePasswordChange} className="login-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password (min 8 characters)"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength={8}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Vili Vardar</h1>
          <p>Hotel Booking System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
