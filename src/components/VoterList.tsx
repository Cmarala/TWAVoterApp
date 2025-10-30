import React, { useState, useEffect } from 'react'
import { 
  List, 
  Card, 
  Avatar, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Typography, 
  Button,
  Badge,
  Row,
  Col,
  Divider
} from 'antd'
import { 
  UserOutlined, 
  SearchOutlined, 
  EnvironmentOutlined,
  PhoneOutlined,
  IdcardOutlined
} from '@ant-design/icons'
import { useAppStore } from '../stores/appStore'
import { VoterInfo } from '../utils/database'

const { Text, Title } = Typography
const { Search } = Input
const { Option } = Select

interface VoterListProps {
  onVoterSelect?: (voter: VoterInfo) => void
  selectedVoterId?: number | null
}

export const VoterList: React.FC<VoterListProps> = ({ 
  onVoterSelect, 
  selectedVoterId 
}) => {
  const { voters, loadVoters } = useAppStore()
  const [filteredVoters, setFilteredVoters] = useState<VoterInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [wardFilter, setWardFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [districtFilter, setDistrictFilter] = useState<string>('')

  useEffect(() => {
    loadVoters()
  }, [loadVoters])

  useEffect(() => {
    let filtered = [...voters]

    // Search by name, voter ID, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(voter => 
        voter.fullName?.toLowerCase().includes(query) ||
        voter.firstName.toLowerCase().includes(query) ||
        voter.lastName.toLowerCase().includes(query) ||
        voter.voterId.toLowerCase().includes(query) ||
        voter.phoneNumber?.toLowerCase().includes(query)
      )
    }

    // Filter by ward
    if (wardFilter) {
      filtered = filtered.filter(voter => voter.address.ward === wardFilter)
    }

    // Filter by district  
    if (districtFilter) {
      filtered = filtered.filter(voter => voter.address.district === districtFilter)
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(voter => voter.registrationStatus === statusFilter)
    }

    setFilteredVoters(filtered)
  }, [voters, searchQuery, wardFilter, statusFilter, districtFilter])

  // Get unique values for filters
  const wards = [...new Set(voters.map(v => v.address.ward))].sort()
  const districts = [...new Set(voters.map(v => v.address.district))].sort()
  const statuses = [...new Set(voters.map(v => v.registrationStatus))].sort()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'green'
      case 'registered': return 'blue'
      case 'pending': return 'orange'
      case 'inactive': return 'default'
      default: return 'default'
    }
  }

  const handleVoterClick = (voter: VoterInfo) => {
    if (onVoterSelect) {
      onVoterSelect(voter)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setWardFilter('')
    setStatusFilter('')
    setDistrictFilter('')
  }

  return (
    <Card 
      title={
        <Space>
          <UserOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Voter Directory
          </Title>
          <Badge count={filteredVoters.length} showZero color="blue" />
        </Space>
      }
      extra={
        <Button size="small" onClick={clearFilters}>
          Clear Filters
        </Button>
      }
    >
      {/* Search and Filters */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Search
          placeholder="Search by name, voter ID, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
        
        <Row gutter={8}>
          <Col span={8}>
            <Select
              placeholder="Filter by Ward"
              value={wardFilter}
              onChange={setWardFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {wards.map(ward => (
                <Option key={ward} value={ward}>{ward}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filter by District"
              value={districtFilter}
              onChange={setDistrictFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {districts.map(district => (
                <Option key={district} value={district}>{district}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {statuses.map(status => (
                <Option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Space>

      {/* Voter List */}
      <List
        dataSource={filteredVoters}
        renderItem={(voter) => (
          <List.Item
            style={{ 
              cursor: 'pointer',
              backgroundColor: selectedVoterId === voter.id ? '#f0f8ff' : 'transparent',
              borderRadius: 6,
              marginBottom: 8,
              padding: 12,
              border: selectedVoterId === voter.id ? '2px solid #1890ff' : '1px solid #f0f0f0'
            }}
            onClick={() => handleVoterClick(voter)}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: selectedVoterId === voter.id ? '#1890ff' : '#87d068' 
                  }}
                >
                  {voter.firstName.charAt(0)}{voter.lastName.charAt(0)}
                </Avatar>
              }
              title={
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {voter.fullName}
                  </Text>
                  <Tag color={getStatusColor(voter.registrationStatus)}>
                    {voter.registrationStatus.toUpperCase()}
                  </Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Space>
                    <IdcardOutlined />
                    <Text type="secondary">ID: {voter.voterId}</Text>
                  </Space>
                  
                  <Space>
                    <EnvironmentOutlined />
                    <Text type="secondary">
                      {voter.address.ward}, {voter.address.district}
                    </Text>
                  </Space>
                  
                  {voter.phoneNumber && (
                    <Space>
                      <PhoneOutlined />
                      <Text type="secondary">{voter.phoneNumber}</Text>
                    </Space>
                  )}
                  
                  {voter.demographics?.age && (
                    <Text type="secondary">
                      Age: {voter.demographics.age} | 
                      {voter.demographics.gender && ` ${voter.demographics.gender}`} |
                      {voter.demographics.occupation && ` ${voter.demographics.occupation}`}
                    </Text>
                  )}
                </Space>
              }
            />
            
            <div>
              <Button 
                type={selectedVoterId === voter.id ? "primary" : "default"}
                size="small"
              >
                {selectedVoterId === voter.id ? "Selected" : "Select"}
              </Button>
            </div>
          </List.Item>
        )}
        locale={{
          emptyText: filteredVoters.length === 0 && voters.length > 0 
            ? "No voters match your search criteria" 
            : "No voters found in database"
        }}
      />

      {/* Summary Stats */}
      {voters.length > 0 && (
        <>
          <Divider />
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {voters.length}
                </Title>
                <Text type="secondary">Total Voters</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  {voters.filter(v => v.registrationStatus === 'verified').length}
                </Title>
                <Text type="secondary">Verified</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                  {voters.filter(v => v.registrationStatus === 'pending').length}
                </Title>
                <Text type="secondary">Pending</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                  {wards.length}
                </Title>
                <Text type="secondary">Wards</Text>
              </div>
            </Col>
          </Row>
        </>
      )}
    </Card>
  )
}

export default VoterList