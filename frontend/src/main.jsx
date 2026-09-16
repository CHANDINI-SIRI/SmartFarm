import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { AppProvider } from './context/AppContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import AutoTranslator from './components/AutoTranslator';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <AutoTranslator />
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);