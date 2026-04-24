import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import { ProfileProvider } from './ProfileContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </ThemeProvider>
  </BrowserRouter>
)
