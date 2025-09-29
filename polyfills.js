// Polyfills for React Native development build
// These fix compatibility issues with libraries that expect web APIs

// Create window object if it doesn't exist
if (typeof window === 'undefined') {
  global.window = global;
}

// Polyfill window.addEventListener for expo-router
if (typeof window !== 'undefined') {
  if (!window.addEventListener) {
    window.addEventListener = () => {};
    window.removeEventListener = () => {};
    window.dispatchEvent = () => true;
  }
  
  if (!window.history) {
    window.history = {
      pushState: () => {},
      replaceState: () => {},
      go: () => {},
      back: () => {},
      forward: () => {},
      length: 1,
      state: null,
    };
  }
  
  if (!window.location) {
    window.location = {
      href: 'http://localhost/',
      pathname: '/',
      search: '',
      hash: '',
      host: 'localhost',
      hostname: 'localhost',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    };
  }
  
  if (!window.navigator) {
    window.navigator = {
      userAgent: 'ReactNative',
      platform: 'iOS',
    };
  }
  
  if (!window.getComputedStyle) {
    window.getComputedStyle = () => ({
      paddingTop: '0px',
      paddingBottom: '0px', 
      paddingLeft: '0px',
      paddingRight: '0px',
      getPropertyValue: () => '0px'
    });
  }
  
  if (!window.document) {
    window.document = {
      createElement: (tagName) => {
        // Create a mock element with style property for SafeAreaProvider compatibility
        const mockElement = {
          style: {},
          appendChild: () => {},
          removeChild: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
          addEventListener: () => {},
          removeEventListener: () => {},
          getBoundingClientRect: () => ({
            top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0
          })
        };
        return mockElement;
      },
      getElementById: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        appendChild: () => {},
        removeChild: () => {},
        style: {}
      },
      documentElement: {
        style: {}
      }
    };
  }
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
       args[0].includes('window.addEventListener is not a function') ||
       args[0].includes('Cannot set property \'position\' of undefined') ||
       args[0].includes('element.addEventListener is not a function') ||
       args[0].includes('window.getComputedStyle is not a function') ||
       args[0].includes('View config getter callback for component') ||
       args[0].includes('ModalsRenderer.web.js') ||
       args[0].includes('@expo/metro-runtime') ||
       args[0].includes('Unable to resolve "@expo/metro-runtime"') ||
       args[0].includes('NativeSafeAreaProvider.web.tsx'))
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