import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ContentProvider } from './contexts/ContentContext.tsx';
import { QuoteProvider } from './contexts/QuoteContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ContentProvider>
        <QuoteProvider>
          <App />
        </QuoteProvider>
      </ContentProvider>
    </AuthProvider>
  </StrictMode>,
);
