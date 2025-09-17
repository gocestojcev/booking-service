// Company Context Service
// This manages the current company data

import { Company } from './api';

// Global variable to store the current company
let currentCompany: Company | null = null;

export const companyContext = {
  // Set the current company
  setCurrentCompany: (company: Company | null): void => {
    currentCompany = company;
    console.log('Company context updated:', company);
  },

  // Get current company
  getCurrentCompany: (): Company | null => {
    return currentCompany;
  },

  // Get company name
  getCompanyName: (): string => {
    return currentCompany?.Name || 'Loading...';
  },

  // Check if company is loaded
  isCompanyLoaded: (): boolean => {
    return currentCompany !== null;
  },

  // Clear company data
  clearCompany: (): void => {
    currentCompany = null;
    console.log('Company context cleared');
  }
};

export default companyContext;
