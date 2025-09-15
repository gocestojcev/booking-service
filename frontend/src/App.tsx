import React from 'react';
import { Amplify } from 'aws-amplify';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticatedApp from './components/AuthenticatedApp';
import awsConfig from './config/aws-config';
import './App.css';

// Configure Amplify
Amplify.configure(awsConfig);

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AuthenticatedApp />
      </div>
    </AuthProvider>
  );
}

export default App;
