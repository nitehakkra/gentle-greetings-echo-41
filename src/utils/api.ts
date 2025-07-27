// API helper for server communication
// Dynamic API base URL based on environment
const getApiBaseUrl = () => {
  // In development (localhost), use port 3001 for backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // In production, use the same domain as frontend
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  // Store successful payment data
  async storeSuccessPayment(hash: string, paymentData: any) {
    console.log('📤 Storing payment data on server:', { hash, apiUrl: API_BASE_URL });
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
      console.log('✅ Payment data stored successfully:', result);
      return result;
    } catch (error) {
      console.error('Error storing payment data:', error);
      throw error;
    }
  },

  // Retrieve successful payment data
  async getSuccessPayment(hash: string) {
    console.log('📥 Fetching payment data from server:', { hash, apiUrl: API_BASE_URL });
    try {
      const response = await fetch(`${API_BASE_URL}/api/success-payment/${hash}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ Payment not found on server (404)');
          return null; // Payment not found
        }
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Payment data fetched successfully:', result);
      return result.success ? result.paymentData : null;
    } catch (error) {
      console.error('Error fetching payment data:', error);
      return null;
    }
  }
};
