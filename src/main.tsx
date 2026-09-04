import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/useTheme'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(18, 22, 31)',
                color: 'rgb(237, 239, 243)',
                border: '1px solid rgb(35, 40, 56)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              error: { style: { background: 'rgb(127, 29, 29)', color: '#fff', border: '1px solid rgb(239, 68, 68)' } },
              success: { style: { background: 'rgb(6, 78, 59)', color: '#fff', border: '1px solid rgb(34, 197, 94)' } },
            }}
          />
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
