// Polyfills for React Native development build
// These fix compatibility issues with libraries that expect web APIs

// Polyfill window.addEventListener for expo-router
if (typeof window !== 'undefined' && !window.addEventListener) {
  window.addEventListener = () => {};
  window.removeEventListener = () => {};
  window.dispatchEvent = () => true;
  window.history = {
    pushState: () => {},
    replaceState: () => {},
    go: () => {},
    back: () => {},
    forward: () => {},
  };
  window.location = {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    host: '',
    hostname: '',
    origin: '',
    port: '',
    protocol: 'https:',
  };
}

// Suppress worklet warnings in development
if (__DEV__ && global.console) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      (args[0].includes('createSerializableObject should never be called in JSWorklets') ||
       args[0].includes('ExpoPushTokenManager'))
    ) {
      return; // Suppress these specific warnings
    }
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      (args[0].includes('ExpoPushTokenManager') ||
       args[0].includes('window.addEventListener is not a function'))
    ) {
      return; // Suppress these specific errors
    }
    originalError.apply(console, args);
  };
}

// Make sure global is defined for libraries that expect it
if (typeof global === 'undefined') {
  global = globalThis;
}

export {};