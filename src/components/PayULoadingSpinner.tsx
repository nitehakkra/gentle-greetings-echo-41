import React from 'react';

// PayU-style loading spinner with animated rotating dots
const PayULoadingSpinner = ({ size = 60 }: { size?: number }) => {
  const dotSize = Math.max(8, size / 7);
  const radius = (size - dotSize) / 2;
  
  // Define the colors that match PayU style
  const colors = [
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#f1c40f', // Yellow
    '#27ae60', // Green
    '#2ecc71', // Light Green
    '#17a2b8', // Teal
    '#3498db', // Blue
    '#9b59b6'  // Purple
  ];

  return (
    <div className="flex items-center justify-center">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {colors.map((color, index) => {
          const angle = (index * 45) * (Math.PI / 180); // 45 degrees apart
          const x = radius + radius * Math.cos(angle - Math.PI / 2);
          const y = radius + radius * Math.sin(angle - Math.PI / 2);
          
          return (
            <div
              key={index}
              className="absolute rounded-full animate-pulse"
              style={{
                width: dotSize,
                height: dotSize,
                left: x,
                top: y,
                backgroundColor: color,
                animation: `payuSpin 1.2s linear infinite, payuFade 1.2s ease-in-out infinite`,
                animationDelay: `${index * 0.15}s`,
                transformOrigin: `${radius - x}px ${radius - y}px`
              }}
            />
          );
        })}
      </div>
      
      <style>{`
        @keyframes payuSpin {
          0% {
            transform: rotate(0deg) scale(0.8);
            opacity: 0.4;
          }
          50% {
            transform: rotate(180deg) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) scale(0.8);
            opacity: 0.4;
          }
        }
        
        @keyframes payuFade {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default PayULoadingSpinner;
