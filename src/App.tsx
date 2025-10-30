import React, { useState } from 'react'
import { Card, Typography, Space, Tag, Avatar, Row, Col, Button } from 'antd'
import { UserOutlined, WifiOutlined, DisconnectOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from './stores/appStore'
import { showTelegramAlert } from './utils/telegram'
import { VoterInfo } from './utils/database'
import { useOnlineStatus, checkOfflineCapability, updateCache } from './utils/offline'
import VoterList from './components/VoterList'
import VoterDetails from './components/VoterDetails'

const { Title, Text } = Typography

function App() {
  const { 
    user,
    voters, 
    initializeApp
  } = useAppStore()

  const [selectedVoter, setSelectedVoter] = useState<VoterInfo | null>(null)
  const [offlineCapable, setOfflineCapable] = useState(false)
  
  // Use custom online status hook
  const isOnline = useOnlineStatus()

  React.useEffect(() => {
    initializeApp()
    
    // Check offline capability
    checkOfflineCapability().then(setOfflineCapable)
    
    // Enhanced Telegram Web App detection and offline handling
    const handleTelegramInit = () => {
      if (window.Telegram?.WebApp) {
        const isOfflineMode = !navigator.onLine || !(window.Telegram.WebApp as any)?.initData;
        console.log(isOfflineMode ? 
          '📱 Telegram Web App initialized in OFFLINE mode - Using cached data' : 
          '✅ Telegram Web App initialized ONLINE - Fresh session'
        );
        
        // If offline and we have cached user data, restore it
        if (isOfflineMode) {
          const cachedUser = localStorage.getItem('twa_user');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              console.log('👤 Restored cached user data for offline mode:', userData);
            } catch (e) {
              console.log('⚠️ Could not restore cached user data');
            }
          }
        }
      }
    };

    // Handle both immediate and delayed Telegram initialization
    handleTelegramInit();
    window.addEventListener('TelegramWebAppReady', handleTelegramInit);
  }, [initializeApp])

  const handleRefreshCache = async () => {
    try {
      await updateCache()
      showTelegramAlert('Cache updated successfully! App is ready for offline use.')
    } catch (error) {
      showTelegramAlert('Failed to update cache. Please try again.')
    }
  }

  const handleVoterSelect = (voter: VoterInfo) => {
    setSelectedVoter(voter)
    showTelegramAlert(`Selected voter: ${voter.fullName} (${voter.voterId})`)
  }

  const handleStartSurvey = (voter: VoterInfo) => {
    showTelegramAlert(`Starting survey for ${voter.fullName}.\n\nThis will open the survey interface for data collection.`)
    // TODO: Navigate to survey interface
    console.log('Starting survey for voter:', voter)
  }

  const connectionStatus = isOnline ? (
    <Space>
      <Tag icon={<WifiOutlined />} color="success">Online</Tag>
      {offlineCapable && <Tag color="blue">Offline Ready ✨</Tag>}
      {window.Telegram?.WebApp && <Tag color="purple" style={{ fontSize: '10px' }}>TWA Mode</Tag>}
    </Space>
  ) : (
    <Space>
      <Tag icon={<DisconnectOutlined />} color={offlineCapable ? "processing" : "error"}>
        {offlineCapable ? "Offline Mode 📱" : "No Offline Support"}
      </Tag>
      {window.Telegram?.WebApp && <Tag color="purple" style={{ fontSize: '10px' }}>TWA Mode</Tag>}
      {!offlineCapable && (
        <Button 
          size="small" 
          type="link" 
          icon={<ReloadOutlined />}
          onClick={handleRefreshCache}
        >
          Enable Offline
        </Button>
      )}
    </Space>
  )

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh',
      background: 'var(--tg-theme-bg-color, #f5f5f5)',
      color: 'var(--tg-theme-text-color, #000000)'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>
                  Field Survey App
                </Title>
              </Space>
              {connectionStatus}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              House-to-house survey collection • {voters.length} voters loaded
            </div>
          </Space>
        </Card>

        {/* Agent Info */}
        <Card size="small">
          <Space align="center">
            <Avatar 
              size="large" 
              icon={<UserOutlined />}
              src={user?.photo_url}
              style={{ backgroundColor: '#52c41a' }}
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>
                Field Agent: {user?.first_name || 'Agent'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Platform: {window.Telegram?.WebApp?.platform || 'Web'} • 
                Ready for field collection
              </div>
            </div>
          </Space>
        </Card>

        {/* Main Interface - Two Column Layout */}
        <Row gutter={16}>
          {/* Left Column - Voter List */}
          <Col xs={24} md={selectedVoter ? 10 : 24}>
            <VoterList 
              onVoterSelect={handleVoterSelect}
              selectedVoterId={selectedVoter?.id || null}
            />
          </Col>
          
          {/* Right Column - Voter Details (only show when voter selected) */}
          {selectedVoter && (
            <Col xs={24} md={14}>
              <VoterDetails 
                voter={selectedVoter}
                onStartSurvey={handleStartSurvey}
              />
            </Col>
          )}
        </Row>

        {/* Offline Status */}
        {!isOnline && (
          <Card style={{ borderColor: offlineCapable ? '#52c41a' : '#faad14' }}>
            <Space>
              <DisconnectOutlined style={{ color: offlineCapable ? '#52c41a' : '#faad14' }} />
              <div>
                {offlineCapable ? (
                  <div>
                    <strong>Offline Field Mode Active</strong> - All features available offline.<br />
                    <Text type="secondary">
                      {voters.length} voters cached • Survey data will sync when online
                    </Text>
                  </div>
                ) : (
                  <div>
                    <strong>Limited Offline Mode</strong> - Some features may not work.<br />
                    <Text type="secondary">
                      Click "Enable Offline" to cache all resources for full offline support
                    </Text>
                  </div>
                )}
              </div>
            </Space>
          </Card>
        )}

        {/* Quick Stats */}
        <Card title="Today's Progress" size="small">
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {voters.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Voters</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {voters.filter((v: VoterInfo) => v.registrationStatus === 'verified').length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Eligible</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                0
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Completed Surveys</div>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  )
}

export default App