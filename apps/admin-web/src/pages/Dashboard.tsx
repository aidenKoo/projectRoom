import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, userGrowthRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/user-growth'),
        ]);
        setStats(statsRes.data);
        setUserGrowth(userGrowthRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Users" value={stats?.totalUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Matches" value={stats?.matching?.totalMatches} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Match Rate"
              value={stats?.matching?.matchRate}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Messages" value={stats?.messaging?.totalMessages} />
          </Card>
        </Col>
      </Row>

      <Title level={3} style={{ margin: '32px 0 16px' }}>User Growth (Last 30 Days)</Title>
      <Card>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Dashboard;