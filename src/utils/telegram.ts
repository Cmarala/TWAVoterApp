// Telegram WebApp utilities following TechStack.md requirements
import type { WebApp } from '@telegram-apps/sdk'

declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp
    }
  }
}

export const initializeTelegram = (): void => {
  // Initialize Telegram WebApp if available
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    
    // Expand the app to full height
    tg.expand()
    
    // Enable closing confirmation for better UX
    tg.enableClosingConfirmation()
    
    // Set header color to match theme
    tg.setHeaderColor('bg_color')
    
    // Mark as ready
    tg.ready()
    
    console.log('Telegram WebApp initialized:', {
      platform: tg.platform,
      version: tg.version,
      colorScheme: tg.colorScheme,
      user: tg.initDataUnsafe?.user
    })
  } else {
    console.warn('Telegram WebApp not available - running in web mode')
  }
}

export const getTelegramUser = () => {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null
}

export const showTelegramAlert = (message: string): void => {
  if (window.Telegram?.WebApp?.showAlert) {
    window.Telegram.WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

export const isTelegramWebApp = (): boolean => {
  return !!(window.Telegram?.WebApp)
}

export const getTelegramTheme = () => {
  const tg = window.Telegram?.WebApp
  if (!tg) return 'light'
  
  return tg.colorScheme === 'dark' ? 'dark' : 'light'
}