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
                background: 'rgb(16, 23, 40)',
                color: 'rgb(240, 238, 244)',
                border: '1px solid rgb(28, 38, 58)',
                borderRadius: '3px',
                fontSize: '14px',
              },
              error: { style: { background: 'rgb(127, 29, 29)', color: '#fff', border: '1px solid rgb(239, 68, 68)' } },
              success: { style: { background: 'rgb(6, 78, 59)', color: '#fff', border: '1px solid rgb(34, 197, 94)' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
