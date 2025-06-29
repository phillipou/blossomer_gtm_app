import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// MSW integration: start worker in dev if VITE_API_MOCK is set
if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK === '1') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
