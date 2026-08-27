import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#131922',
                color: '#e6edf6',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                fontSize: '14px',
              },
              error: { style: { background: '#7f1d1d', color: '#fff', border: '1px solid #ef4444' } },
              success: { style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
