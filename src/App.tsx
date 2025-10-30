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
    currentVoter,
    voters, 
    initializeApp,
    showGreeting 
  } = useAppStore()

  React.useEffect(() => {
    initializeApp()
  }, [initializeApp])

  const handleGreeting = () => {
    const telegramUser = getTelegramUser()
    const voterName = currentVoter?.firstName || telegramUser?.first_name || 'Voter'
    const message = `Hello, ${voterName}! Welcome to TWA Voter Registration 🗳️`
    
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
              TWA Voter Registry 🗳️
            </Title>
            <Paragraph style={{ textAlign: 'center', margin: 0 }}>
              Production-grade Telegram Web App for voter registration and management
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

        {/* Voter Info */}
        <Card title="Voter Information">
          {currentVoter ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Name:</strong> {currentVoter.fullName}
              </div>
              <div>
                <strong>Voter ID:</strong> {currentVoter.voterId}
              </div>
              <div>
                <strong>Constituency:</strong> {currentVoter.address.constituency}
              </div>
              <div>
                <strong>Status:</strong> 
                <Tag color={currentVoter.registrationStatus === 'verified' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                  {currentVoter.registrationStatus.toUpperCase()}
                </Tag>
              </div>
            </Space>
          ) : (
            <Paragraph>
              🗳️ No voter registration found. Complete your registration to access voting features.
            </Paragraph>
          )}
        </Card>

        {/* Database Status */}
        {voters.length > 0 && (
          <Card title={`Voters Database (${voters.length} registered)`}>
            <Paragraph>
              📊 Voter data loaded from offline database (IndexedDB + Dexie.js)
            </Paragraph>
            <Paragraph style={{ fontSize: '12px', opacity: 0.7 }}>
              Following TechStack.md architecture for constituency-based voter management
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