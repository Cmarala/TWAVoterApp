import React from 'react'
import { 
  Card, 
  Descriptions, 
  Tag, 
  Avatar, 
  Space, 
  Typography, 
  Button,
  Divider,
  Row,
  Col,
  Empty
} from 'antd'
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  MailOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined
} from '@ant-design/icons'
import { VoterInfo } from '../utils/database'

const { Title, Text } = Typography

interface VoterDetailsProps {
  voter: VoterInfo | null
  onStartSurvey?: (voter: VoterInfo) => void
}

export const VoterDetails: React.FC<VoterDetailsProps> = ({ 
  voter, 
  onStartSurvey 
}) => {
  if (!voter) {
    return (
      <Card title="Voter Details">
        <Empty 
          description="Select a voter to view details"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'green'
      case 'registered': return 'blue'
      case 'pending': return 'orange'
      case 'inactive': return 'default'
      default: return 'default'
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Not available'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const handleStartSurvey = () => {
    if (onStartSurvey) {
      onStartSurvey(voter)
    }
  }

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Voter Details
          </Title>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          size="large"
          onClick={handleStartSurvey}
          disabled={voter.registrationStatus !== 'verified'}
        >
          Start Survey
        </Button>
      }
    >
      {/* Header with Avatar and Status */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Avatar 
            size={80} 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          >
            {voter.firstName.charAt(0)}{voter.lastName.charAt(0)}
          </Avatar>
        </Col>
        <Col span={20}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0 }}>
              {voter.fullName}
            </Title>
            <Space>
              <Tag color={getStatusColor(voter.registrationStatus)} style={{ fontSize: 14 }}>
                {voter.registrationStatus.toUpperCase()}
              </Tag>
              {voter.registrationStatus !== 'verified' && (
                <Text type="warning">
                  Survey not available - voter not verified
                </Text>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Voter ID: {voter.voterId}
            </Text>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* Personal Information */}
      <Title level={5}>
        <IdcardOutlined /> Personal Information
      </Title>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="First Name" span={1}>
          {voter.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Last Name" span={1}>
          {voter.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Phone Number" span={1}>
          <Space>
            <PhoneOutlined />
            {voter.phoneNumber || 'Not provided'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Email" span={1}>
          <Space>
            <MailOutlined />
            {voter.email || 'Not provided'}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* Address Information */}
      <Title level={5}>
        <EnvironmentOutlined /> Address Information
      </Title>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Street Address" span={2}>
          {voter.address.street || 'Not provided'}
        </Descriptions.Item>
        <Descriptions.Item label="Ward" span={1}>
          {voter.address.ward}
        </Descriptions.Item>
        <Descriptions.Item label="District" span={1}>
          {voter.address.district}
        </Descriptions.Item>
        <Descriptions.Item label="Constituency" span={1}>
          <Space>
            <BankOutlined />
            {voter.address.constituency}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="PIN Code" span={1}>
          {voter.address.pincode || 'Not provided'}
        </Descriptions.Item>
      </Descriptions>

      {/* Demographics (if available) */}
      {voter.demographics && (
        <>
          <Title level={5}>
            <TeamOutlined /> Demographics
          </Title>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Age" span={1}>
              {voter.demographics.age || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Gender" span={1}>
              {voter.demographics.gender ? 
                voter.demographics.gender.charAt(0).toUpperCase() + 
                voter.demographics.gender.slice(1) : 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Occupation" span={1}>
              {voter.demographics.occupation || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Education" span={1}>
              {voter.demographics.education || 'Not provided'}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {/* System Information */}
      <Title level={5}>
        <CalendarOutlined /> System Information
      </Title>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Registration Status" span={1}>
          <Tag color={getStatusColor(voter.registrationStatus)}>
            {voter.registrationStatus.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Sync Status" span={1}>
          <Tag color={voter.synced ? 'green' : 'orange'}>
            {voter.synced ? 'SYNCED' : 'PENDING SYNC'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created Date" span={1}>
          {formatDate(voter.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated" span={1}>
          {formatDate(voter.updatedAt)}
        </Descriptions.Item>
        {voter.telegramUserId && (
          <Descriptions.Item label="Telegram ID" span={1}>
            {voter.telegramUserId}
          </Descriptions.Item>
        )}
        {voter.lastSyncedAt && (
          <Descriptions.Item label="Last Synced" span={1}>
            {formatDate(voter.lastSyncedAt)}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Action Button */}
      <Divider />
      <div style={{ textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large"
          onClick={handleStartSurvey}
          disabled={voter.registrationStatus !== 'verified'}
          style={{ width: 200 }}
        >
          {voter.registrationStatus === 'verified' ? 
            'Start Survey Interview' : 
            'Voter Not Eligible for Survey'
          }
        </Button>
        {voter.registrationStatus !== 'verified' && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Only verified voters can participate in surveys
            </Text>
          </div>
        )}
      </div>
    </Card>
  )
}

export default VoterDetails