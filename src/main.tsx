import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider, theme } from 'antd'
import { initializeTelegram } from './utils/telegram.ts'
import { initializeOfflineDB } from './utils/database.ts'
import './index.css'

// Initialize Telegram WebApp
initializeTelegram()

// Initialize offline database
initializeOfflineDB()

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Check for VitePWA auto-registration first
      let registration = await navigator.serviceWorker.getRegistration()
      
      if (!registration) {
        // Fallback manual registration
        registration = await navigator.serviceWorker.register('/TWAVoterApp/sw.js', {
          scope: '/TWAVoterApp/'
        })
        console.log('Service Worker registered manually:', registration)
      } else {
        console.log('Service Worker already registered:', registration)
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, please refresh!')
              // Optionally notify user about update
            }
          })
        }
      })

      // Handle offline/online events
      window.addEventListener('online', () => {
        console.log('Back online - ready to sync data')
      })

      window.addEventListener('offline', () => {
        console.log('Gone offline - using cached resources')
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

// Get Telegram theme for Ant Design
const telegramTheme = window.Telegram?.WebApp?.colorScheme === 'dark'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: telegramTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2481cc',
          borderRadius: 12,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)