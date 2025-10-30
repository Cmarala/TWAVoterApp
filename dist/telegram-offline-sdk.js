// Offline Telegram WebApp SDK Fallback
// This provides basic Telegram WebApp functionality when offline

(function() {
  'use strict';
  
  // Check if we're already online and have real Telegram SDK
  if (window.Telegram?.WebApp && navigator.onLine) {
    console.log('✅ Using real Telegram SDK (online)');
    return;
  }
  
  console.log('🔄 Loading offline Telegram SDK fallback...');
  
  // Mock Telegram WebApp object for offline use
  window.Telegram = window.Telegram || {};
  
  // Create a comprehensive mock WebApp object
  const mockWebApp = {
    // Basic info
    initData: localStorage.getItem('twa_initData') || '',
    initDataUnsafe: JSON.parse(localStorage.getItem('twa_initDataUnsafe') || '{}'),
    version: '6.0',
    platform: 'web',
    
    // Colors and theme (use cached or defaults)
    colorScheme: localStorage.getItem('twa_colorScheme') || 'light',
    themeParams: JSON.parse(localStorage.getItem('twa_themeParams') || JSON.stringify({
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff'
    })),
    
    // Viewport info
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    isExpanded: true,
    
    // Mock user info (use cached data)
    WebAppUser: JSON.parse(localStorage.getItem('twa_user') || 'null'),
    
    // Mock methods with offline-friendly implementations
    ready: function() {
      console.log('📱 Telegram WebApp ready (offline mode)');
      // Apply cached theme
      this.applyTheme();
    },
    
    close: function() {
      console.log('🔒 App close requested (offline mode)');
      // In offline mode, we can't actually close, just show message
      alert('App running in offline mode. Please use browser controls to close.');
    },
    
    expand: function() {
      console.log('📏 Expand requested (offline mode)');
      this.isExpanded = true;
    },
    
    sendData: function(data) {
      console.log('📤 Data send requested (offline mode):', data);
      // Queue data for when we're back online
      const queuedData = JSON.parse(localStorage.getItem('twa_queuedData') || '[]');
      queuedData.push({
        data: data,
        timestamp: Date.now()
      });
      localStorage.setItem('twa_queuedData', JSON.stringify(queuedData));
    },
    
    openLink: function(url) {
      console.log('🔗 Link open requested (offline mode):', url);
      window.open(url, '_blank');
    },
    
    openTelegramLink: function(url) {
      console.log('📱 Telegram link requested (offline mode):', url);
      // Queue for when online
      localStorage.setItem('twa_pendingTelegramLink', url);
    },
    
    showAlert: function(message, callback) {
      console.log('⚠️ Alert requested (offline mode):', message);
      alert(message);
      if (callback) callback();
    },
    
    showConfirm: function(message, callback) {
      console.log('❓ Confirm requested (offline mode):', message);
      const result = confirm(message);
      if (callback) callback(result);
    },
    
    showPopup: function(params, callback) {
      console.log('📋 Popup requested (offline mode):', params);
      const message = params.message || params.title || 'Notification';
      alert(message);
      if (callback) callback('ok');
    },
    
    setHeaderColor: function(color) {
      console.log('🎨 Header color change (offline mode):', color);
      // Apply to document
      document.documentElement.style.setProperty('--tg-header-color', color);
    },
    
    setBackgroundColor: function(color) {
      console.log('🎨 Background color change (offline mode):', color);
      document.documentElement.style.setProperty('--tg-theme-bg-color', color);
    },
    
    // Apply cached theme
    applyTheme: function() {
      const theme = this.themeParams;
      const root = document.documentElement;
      
      // Apply CSS custom properties
      Object.keys(theme).forEach(key => {
        const cssVar = `--tg-theme-${key.replace(/_/g, '-')}`;
        root.style.setProperty(cssVar, theme[key]);
      });
      
      // Apply color scheme class
      document.body.classList.toggle('dark-theme', this.colorScheme === 'dark');
    },
    
    // MainButton mock
    MainButton: {
      text: '',
      color: '#2481cc',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      
      setText: function(text) {
        this.text = text;
        console.log('🔘 MainButton text set (offline):', text);
      },
      
      onClick: function(callback) {
        this.callback = callback;
        console.log('🔘 MainButton onClick set (offline)');
      },
      
      show: function() {
        this.isVisible = true;
        console.log('🔘 MainButton shown (offline)');
      },
      
      hide: function() {
        this.isVisible = false;
        console.log('🔘 MainButton hidden (offline)');
      },
      
      enable: function() {
        this.isActive = true;
        console.log('🔘 MainButton enabled (offline)');
      },
      
      disable: function() {
        this.isActive = false;
        console.log('🔘 MainButton disabled (offline)');
      }
    },
    
    // BackButton mock
    BackButton: {
      isVisible: false,
      
      onClick: function(callback) {
        this.callback = callback;
        console.log('⬅️ BackButton onClick set (offline)');
      },
      
      show: function() {
        this.isVisible = true;
        console.log('⬅️ BackButton shown (offline)');
      },
      
      hide: function() {
        this.isVisible = false;
        console.log('⬅️ BackButton hidden (offline)');
      }
    }
  };
  
  // Assign mock WebApp
  window.Telegram.WebApp = mockWebApp;
  
  // Cache current state for future offline use
  function cacheWebAppState() {
    if (navigator.onLine && window.Telegram?.WebApp?.initData) {
      localStorage.setItem('twa_initData', window.Telegram.WebApp.initData);
      localStorage.setItem('twa_initDataUnsafe', JSON.stringify(window.Telegram.WebApp.initDataUnsafe || {}));
      localStorage.setItem('twa_colorScheme', window.Telegram.WebApp.colorScheme || 'light');
      localStorage.setItem('twa_themeParams', JSON.stringify(window.Telegram.WebApp.themeParams || {}));
      localStorage.setItem('twa_user', JSON.stringify(window.Telegram.WebApp.WebAppUser || null));
    }
  }
  
  // Listen for online events to cache state
  window.addEventListener('online', cacheWebAppState);
  
  // Initialize the mock WebApp
  mockWebApp.ready();
  
  console.log('✅ Offline Telegram SDK initialized successfully');
  
  // Dispatch ready event
  window.dispatchEvent(new Event('TelegramWebAppReady'));
  
})();