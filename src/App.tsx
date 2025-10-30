import { useState, useEffect } from 'react'
import { Card, Typography, Space, Tag, Button, Row, Col } from 'antd'
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  SearchOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { showTelegramAlert } from './utils/telegram'
import { VoterInfo } from './utils/database'
import { useOnlineStatus, checkOfflineCapability, updateCache } from './utils/offline'
import VoterList from './components/VoterList'
import VoterDetails from './components/VoterDetails'

const { Title, Text } = Typography

type AppView = 'home' | 'voterSearch' | 'voterDetails' | 'reports' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [selectedVoter, setSelectedVoter] = useState<VoterInfo | null>(null)
  const [voterStats, setVoterStats] = useState({ total: 0, surveyed: 0, pending: 0 })
  const [offlineCapable, setOfflineCapable] = useState(false)
  
  // Use custom online status hook
  const isOnline = useOnlineStatus()

  // Initialize app and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        const { voterOperations } = await import('./utils/database')
        
        // Load sample voters if none exist
        const existingVoters = await voterOperations.getAll()
        if (existingVoters.length === 0) {
          // Add sample voters for demo
          await voterOperations.add({
            voterId: 'V001',
            firstName: 'John',
            lastName: 'Doe',
            address: { ward: 'Ward 1', district: 'District A', constituency: 'Constituency 1' },
            registrationStatus: 'registered'
          })
          await voterOperations.add({
            voterId: 'V002', 
            firstName: 'Jane',
            lastName: 'Smith',
            address: { ward: 'Ward 2', district: 'District A', constituency: 'Constituency 1' },
            registrationStatus: 'verified'
          })
        }
        
        // Get all voters
        const allVoters = await voterOperations.getAll()
        
        // Calculate stats (using createdAt as proxy for survey status)
        const surveyed = allVoters.filter((v: VoterInfo) => v.updatedAt && v.updatedAt !== v.createdAt).length
        setVoterStats({
          total: allVoters.length,
          surveyed,
          pending: allVoters.length - surveyed
        })
        
        console.log('✅ App initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize app:', error)
        showTelegramAlert('Failed to initialize app. Please refresh.')
      }
    }

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
  }, [])

  const handleRefreshCache = async () => {
    try {
      await updateCache()
      checkOfflineCapability().then(setOfflineCapable)
      showTelegramAlert('Cache updated successfully!')
    } catch (error) {
      showTelegramAlert('Failed to update cache. Please try again.')
    }
  }

  const handleVoterSelect = (voter: VoterInfo) => {
    setSelectedVoter(voter)
    setCurrentView('voterDetails')
  }

  const handleStartSurvey = (voter: VoterInfo) => {
    showTelegramAlert(`Starting survey for ${voter.fullName || voter.firstName}.\\n\\nThis will open the survey interface for data collection.`)
    // TODO: Navigate to survey interface
    console.log('Starting survey for voter:', voter)
  }

  // Status Banner Component
  const StatusBanner = () => {
    const getStatusColor = () => {
      if (!isOnline && !offlineCapable) return '#ff4d4f' // Red
      if (!isOnline && offlineCapable) return '#faad14' // Orange  
      if (isOnline && offlineCapable) return '#52c41a' // Green
      return '#1890ff' // Blue
    }

    const getStatusText = () => {
      if (!isOnline && !offlineCapable) return 'Offline - Limited'
      if (!isOnline && offlineCapable) return 'Offline Ready'
      if (isOnline && offlineCapable) return 'Online - Synced'
      return 'Online'
    }

    const getStatusIcon = () => {
      return isOnline ? <WifiOutlined /> : <DisconnectOutlined />
    }

    return (
      <Card 
        style={{ 
          background: getStatusColor(),
          borderColor: getStatusColor(),
          marginBottom: 16
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Tag 
                icon={getStatusIcon()}
                color="white"
                style={{ 
                  color: getStatusColor(),
                  borderColor: 'white',
                  fontWeight: 'bold'
                }}
              >
                {getStatusText()}
              </Tag>
              {window.Telegram?.WebApp && (
                <Tag color="white" style={{ color: getStatusColor(), borderColor: 'white' }}>
                  TWA Mode
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            {!offlineCapable && (
              <Button 
                size="small" 
                type="text"
                icon={<ReloadOutlined />}
                onClick={handleRefreshCache}
                style={{ color: 'white' }}
              >
                Enable Offline
              </Button>
            )}
          </Col>
        </Row>
      </Card>
    )
  }

  // App Banner Component
  const AppBanner = () => (
    <Card style={{ marginBottom: 16, textAlign: 'center' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          Field Survey App
        </Title>
        <Text type="secondary">
          House-to-house voter data collection
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {voterStats.total} voters • {voterStats.surveyed} surveyed • {voterStats.pending} pending
        </Text>
      </Space>
    </Card>
  )

  // Feature Grid Component
  const FeatureGrid = () => {
    const features = [
      {
        key: 'voterSearch',
        title: 'Voter Search',
        description: 'Find and browse voters',
        icon: <SearchOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
        action: () => setCurrentView('voterSearch')
      },
      {
        key: 'reports',
        title: 'Reports',
        description: 'View survey reports',
        icon: <BarChartOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
        action: () => setCurrentView('reports')
      },
      {
        key: 'surveys',
        title: 'Surveys',
        description: 'Manage survey forms',
        icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
        action: () => showTelegramAlert('Survey management coming soon!')
      },
      {
        key: 'settings',
        title: 'Settings',
        description: 'App configuration',
        icon: <SettingOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
        action: () => setCurrentView('settings')
      }
    ]

    return (
      <Row gutter={[16, 16]}>
        {features.map((feature) => (
          <Col xs={12} key={feature.key}>
            <Card
              hoverable
              style={{ 
                textAlign: 'center', 
                height: '100%',
                border: '2px solid transparent'
              }}
              bodyStyle={{ padding: '20px 16px' }}
              onClick={feature.action}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {feature.icon}
                <Title level={5} style={{ margin: 0 }}>
                  {feature.title}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {feature.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  // Home Screen Component
  const HomeScreen = () => (
    <div>
      <StatusBanner />
      <AppBanner />
      <FeatureGrid />
    </div>
  )

  // Simple Voter Search Component (no scrolling needed)
  const SimpleVoterSearch = () => (
    <div>
      <Button 
        type="link" 
        onClick={() => setCurrentView('home')}
        style={{ marginBottom: 16 }}
      >
        ← Back to Home
      </Button>
      <Row gutter={16}>
        <Col xs={24} md={selectedVoter ? 14 : 24}>
          <VoterList
            onVoterSelect={handleVoterSelect}
            selectedVoterId={selectedVoter?.id || null}
          />
        </Col>
        {selectedVoter && (
          <Col xs={24} md={10}>
            <VoterDetails
              voter={selectedVoter}
              onStartSurvey={handleStartSurvey}
            />
          </Col>
        )}
      </Row>
    </div>
  )

  // Main App Content
  const renderContent = () => {
    switch (currentView) {
      case 'voterSearch':
        return <SimpleVoterSearch />
      
      case 'voterDetails':
        return selectedVoter ? (
          <div>
            <Button 
              type="link" 
              onClick={() => setCurrentView('home')}
              style={{ marginBottom: 16 }}
            >
              ← Back to Home
            </Button>
            <VoterDetails
              voter={selectedVoter}
              onStartSurvey={handleStartSurvey}
            />
          </div>
        ) : (
          <div>No voter selected</div>
        )
      
      case 'reports':
        return (
          <div>
            <Button 
              type="link" 
              onClick={() => setCurrentView('home')}
              style={{ marginBottom: 16 }}
            >
              ← Back to Home
            </Button>
            <Card>
              <Title level={4}>Survey Reports</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Reports functionality coming soon...</Text>
                <Row gutter={16}>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>Total Voters</Title>
                      <Title level={2} style={{ color: '#1890ff' }}>
                        {voterStats.total}
                      </Title>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>Surveyed</Title>
                      <Title level={2} style={{ color: '#52c41a' }}>
                        {voterStats.surveyed}
                      </Title>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Title level={5}>Pending</Title>
                      <Title level={2} style={{ color: '#faad14' }}>
                        {voterStats.pending}
                      </Title>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>
          </div>
        )
      
      case 'settings':
        return (
          <div>
            <Button 
              type="link" 
              onClick={() => setCurrentView('home')}
              style={{ marginBottom: 16 }}
            >
              ← Back to Home
            </Button>
            <Card>
              <Title level={4}>App Settings</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Settings functionality coming soon...</Text>
                <Button onClick={handleRefreshCache} icon={<ReloadOutlined />}>
                  Refresh Cache
                </Button>
              </Space>
            </Card>
          </div>
        )
      
      default:
        return <HomeScreen />
    }
  }

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh',
      maxWidth: '100vw',
      background: 'var(--tg-theme-bg-color, #f5f5f5)',
      color: 'var(--tg-theme-text-color, #000000)'
    }}>
      {renderContent()}
    </div>
  )
}

export default App