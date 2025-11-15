import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Changed the import syntax for the default export to be more explicit to resolve a potential module resolution issue.
import { default as App } from './App';
import { BrandingProvider } from './contexts/BrandingContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrandingProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrandingProvider>
  </React.StrictMode>
);
