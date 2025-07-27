// Development-only logging utility
// Prevents console logs from showing in production environment

const isDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === 'localhost:8080' ||
         window.location.port === '8080';
};

export const devLog = (...args: any[]) => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment()) {
    console.error(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment()) {
    console.warn(...args);
  }
};

export const devInfo = (...args: any[]) => {
  if (isDevelopment()) {
    console.info(...args);
  }
};
