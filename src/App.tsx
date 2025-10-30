import React from 'react'
import { Button, Card, Typography, Space, Tag, Avatar } from 'antd'
import { UserOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons'
import { useAppStore } from './stores/appStore'
import { getTelegramUser, showTelegramAlert } from './utils/telegram'

const { Title, Paragraph } = Typography

function App() {
  const { 
    isOnline, 
    user, 
    surveys, 
    initializeApp,
    showGreeting 
  } = useAppStore()

  React.useEffect(() => {
    initializeApp()
  }, [initializeApp])

  const handleGreeting = () => {
    const telegramUser = getTelegramUser()
    const message = telegramUser 
      ? `Hello, ${telegramUser.first_name}! Welcome to TWA Voter Survey 🗳️`
      : 'Hello! Welcome to TWA Voter Survey 🗳️'
    
    showTelegramAlert(message)
    showGreeting()
  }

  const connectionStatus = isOnline ? (
    <Tag icon={<WifiOutlined />} color="success">Online</Tag>
  ) : (
    <Tag icon={<DisconnectOutlined />} color="error">Offline Mode</Tag>
  )

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh',
      background: 'var(--tg-theme-bg-color, #ffffff)',
      color: 'var(--tg-theme-text-color, #000000)'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
              TWA Voter Survey 🗳️
            </Title>
            <Paragraph style={{ textAlign: 'center', margin: 0 }}>
              Production-grade Telegram Web App for voter surveys
            </Paragraph>
          </Space>
        </Card>

        {/* User Info */}
        <Card title="User Information">
          <Space align="center">
            <Avatar 
              size="large" 
              icon={<UserOutlined />}
              src={user?.photo_url}
            />
            <div>
              <div><strong>{user?.first_name || 'Guest User'}</strong></div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Platform: {window.Telegram?.WebApp?.platform || 'Web'} | 
                Version: {window.Telegram?.WebApp?.version || '6.0'}
              </div>
              <div>{connectionStatus}</div>
            </div>
          </Space>
        </Card>

        {/* Main Action */}
        <Card title="Quick Actions">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large" 
              block
              onClick={handleGreeting}
            >
              Say Hello! 👋
            </Button>
            
            <Paragraph style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>
              <strong>Tech Stack:</strong> React 18+ • Ant Design • Zustand • Dexie.js • TypeScript
            </Paragraph>
          </Space>
        </Card>

        {/* Survey Info */}
        {surveys.length > 0 && (
          <Card title={`Available Surveys (${surveys.length})`}>
            <Paragraph>
              📊 Surveys loaded from offline database (IndexedDB + Dexie.js)
            </Paragraph>
            <Paragraph style={{ fontSize: '12px', opacity: 0.7 }}>
              Following TechStack.md architecture for production-grade offline support
            </Paragraph>
          </Card>
        )}

        {/* Offline Status */}
        {!isOnline && (
          <Card>
            <Paragraph style={{ textAlign: 'center', margin: 0 }}>
              📱 <strong>Offline Mode Active</strong><br />
              Your data is safely stored locally and will sync when connection is restored.
            </Paragraph>
          </Card>
        )}
      </Space>
    </div>
  )
}

export default App