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