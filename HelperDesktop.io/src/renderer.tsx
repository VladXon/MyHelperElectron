import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryProvider } from './lib/queryClient';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <QueryProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryProvider>
  </StrictMode>,
);

if (!import.meta.env.VITE_PROD) {
  import('react-scan').then(({ scan }) => {
    scan({ enabled: true, log: true });
  });
}
