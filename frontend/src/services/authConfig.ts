import type { Configuration } from '@azure/msal-browser';
import { LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    authority: import.meta.env.VITE_MSAL_AUTHORITY || '',
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',

  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Error,
    },
  },
};

export const loginRequest = {
  scopes: [import.meta.env.VITE_MSAL_SCOPE || ''],
};

export const apiScope = import.meta.env.VITE_MSAL_SCOPE || '';
