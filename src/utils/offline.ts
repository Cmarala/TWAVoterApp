// Offline/Online detection and management utilities
import { useEffect, useState } from 'react'

// Hook to detect online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Connection restored - App is now online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📱 Connection lost - App is now in offline mode')
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Check if app can work offline
export const checkOfflineCapability = async (): Promise<boolean> => {
  try {
    // Check if Service Worker is registered
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported')
      return false
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      console.warn('⚠️ Service Worker not registered')
      return false
    }

    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      console.warn('⚠️ IndexedDB not supported')
      return false
    }

    console.log('✅ Offline capability verified')
    return true

  } catch (error) {
    console.error('❌ Offline capability check failed:', error)
    return false
  }
}

// Force cache update
export const updateCache = async (): Promise<void> => {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      console.log('🔄 Service Worker updated')
    }
  } catch (error) {
    console.error('❌ Cache update failed:', error)
  }
}

// Get cache status information
export const getCacheInfo = async (): Promise<{
  cacheNames: string[]
  totalSize: number
}> => {
  try {
    if (!('caches' in window)) {
      return { cacheNames: [], totalSize: 0 }
    }

    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response && response.body) {
          const reader = response.body.getReader()
          let size = 0
          
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              size += value.length
            }
          } catch (err) {
            // Ignore read errors for size calculation
          } finally {
            reader.releaseLock()
          }
          
          totalSize += size
        }
      }
    }

    return { cacheNames, totalSize }

  } catch (error) {
    console.error('❌ Cache info retrieval failed:', error)
    return { cacheNames: [], totalSize: 0 }
  }
}

// Clear all caches (for debugging)
export const clearAllCaches = async (): Promise<void> => {
  try {
    if (!('caches' in window)) return

    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    
    console.log('🗑️ All caches cleared')
  } catch (error) {
    console.error('❌ Cache clearing failed:', error)
  }
}

// Preload critical resources
export const preloadCriticalResources = async (): Promise<void> => {
  try {
    if (!('caches' in window)) return

    const cache = await caches.open('critical-resources')
    
    // Critical resources to cache
    const criticalUrls = [
      '/TWAVoterApp/',
      '/TWAVoterApp/index.html',
      '/TWAVoterApp/assets/index.js',
      '/TWAVoterApp/assets/index.css',
      'https://telegram.org/js/telegram-web-app.js'
    ]

    await Promise.all(
      criticalUrls.map(async (url) => {
        try {
          await cache.add(url)
          console.log(`✅ Cached: ${url}`)
        } catch (err) {
          console.warn(`⚠️ Failed to cache: ${url}`, err)
        }
      })
    )

  } catch (error) {
    console.error('❌ Critical resource preloading failed:', error)
  }
}