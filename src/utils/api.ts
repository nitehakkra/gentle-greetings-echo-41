// API helper for server communication
// Dynamic API base URL based on environment
import { devLog, devError, devWarn } from './logger';
const getApiBaseUrl = () => {
  // Always use relative URLs since we have Vite proxy configured
  return '';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  // Store successful payment data
  async storeSuccessPayment(hash: string, paymentData: any) {
    devLog('📤 Storing payment data on server:', { hash, apiUrl: API_BASE_URL });
    try {
      const response = await fetch(`${API_BASE_URL}/api/success-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hash,
          paymentData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      devLog('✅ Payment data stored successfully:', result);
      return result;
    } catch (error) {
      console.error('Error storing payment data:', error);
      throw error;
    }
  },

  // Retrieve successful payment data
  async getSuccessPayment(hash: string) {
    devLog('📥 Fetching payment data from server:', { hash, apiUrl: API_BASE_URL });
    try {
      const response = await fetch(`${API_BASE_URL}/api/success-payment/${hash}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          devLog('❌ Payment not found on server (404)');
          return null; // Payment not found
        }
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      devLog('✅ Payment data fetched successfully:', result);
      return result.success ? result.paymentData : null;
    } catch (error) {
      console.error('Error fetching payment data:', error);
      return null;
    }
  }
};
