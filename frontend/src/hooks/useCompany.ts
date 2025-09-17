import { useState, useEffect } from 'react';
import { apiService, Company } from '../services/api';
import { userContext } from '../services/userContext';
import { companyContext } from '../services/companyContext';

export const useCompany = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentUser = userContext.getCurrentUser();
        console.log('Loading company for user:', currentUser);
        
        const companyData = await apiService.getCompany(currentUser.companyId);
        console.log('Company data loaded:', companyData);
        
        setCompany(companyData);
        companyContext.setCurrentCompany(companyData);
      } catch (err) {
        console.error('Error loading company:', err);
        setError('Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  return {
    company,
    loading,
    error,
    companyName: company?.Name || 'Loading...'
  };
};
