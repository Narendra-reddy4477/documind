import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: '12px' },
        success: { iconTheme: { primary: '#8b5cf6', secondary: '#f9fafb' } },
      }} />
    </BrowserRouter>
  </React.StrictMode>
)
