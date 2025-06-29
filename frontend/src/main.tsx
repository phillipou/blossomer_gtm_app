import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Landing from './pages/Landing'

// MSW integration: start worker in dev if VITE_API_MOCK is set
if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK === '1') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start();
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* TODO: Add more routes for dashboard, splash, etc. */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
