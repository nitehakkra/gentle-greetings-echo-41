import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 bg-white flex items-center justify-center z-50 ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="100" 
        height="100" 
        viewBox="0 0 100 100" 
        overflow="visible" 
        fill="#5c5c5c" 
        stroke="#4f4f4f"
      >
        <defs>
          <rect 
            id="loader" 
            x="46.5" 
            y="40" 
            width="7" 
            height="20" 
            rx="2" 
            ry="2" 
            transform="translate(0 -30)" 
          />
        </defs>
        <use xlinkHref="#loader" transform="rotate(45 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.13s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(90 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.25s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(135 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.38s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(180 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.50s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(225 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.63s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(270 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.75s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(315 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.88s" repeatCount="indefinite"></animate>
        </use>
        <use xlinkHref="#loader" transform="rotate(360 50 50)">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="1.00s" repeatCount="indefinite"></animate>
        </use>
      </svg>
    </div>
  );
};

export default LoadingSpinner;
