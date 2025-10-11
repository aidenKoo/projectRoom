import React, { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Alert,
  Typography,
  Table,
  Space,
  Button,
  message,
  Tag,
} from 'antd';
import { ArrowUpOutlined, ExperimentOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useExperimentAssignment } from '../hooks/useExperiment';

const { Title } = Typography;

type DashboardStats = {
  users: {
    total: number;
    active30d: number;
    new24h: number;
  };
  matching: {
    totalLikes: number;
    totalMatches: number;
    matchRate: number;
    averageLikesPerUser: number;
  };
  messaging: {
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    firstMessageRate: number;
  };
  moderation: {
    pending: number;
    autoFlagged: number;
    approved: number;
    rejected: number;
  };
  experiments: {
    timeframeDays: number;
    totals: {
      exposures: number;
      conversions: number;
      conversionRate: number;
    };
    experiments: Array<{
      experiment: string;
      exposures: number;
      conversions: number;
      conversionRate: number;
    }>;
  };
};

type GrowthPoint = { date: string; count: number };
type MatchTrendPoint = { date: string; likes: number; matches: number; matchRate: number };

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [matchTrend, setMatchTrend] = useState<MatchTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const layoutExperiment = useExperimentAssignment('dashboard_layout', {
    variants: ['classic', 'compact'],
    autoRecordExposure: true,
    platform: 'admin-web',
  });

  const layoutVariant = layoutExperiment.variant ?? 'classic';
  const layoutLoading = layoutExperiment.loading;
  const isCompact = layoutVariant === 'compact';
  const primaryGutter: [number, number] = isCompact ? [12, 12] : [16, 16];
  const secondaryGutter: [number, number] = isCompact ? [12, 12] : [16, 16];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, userGrowthRes, matchTrendRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/user-growth?days=30'),
          api.get('/analytics/match-rate-trend?days=30'),
        ]);

        setStats(statsRes.data as DashboardStats);

        const growth = (userGrowthRes.data ?? []).map((item: any) => ({
          date: item.date,
          count: Number(item.count) || 0,
        }));
        setUserGrowth(growth);

        const trend = (matchTrendRes.data ?? []).map((item: any) => ({
          date: item.date,
          likes: Number(item.likes) || 0,
          matches: Number(item.matches) || 0,
          matchRate: Number(item.matchRate) || 0,
        }));
        setMatchTrend(trend);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const moderationCards = useMemo(
    () => [
      { title: 'Pending', value: stats?.moderation.pending ?? 0, color: '#1890ff' },
      { title: 'Auto-Flagged', value: stats?.moderation.autoFlagged ?? 0, color: '#faad14' },
      { title: 'Approved', value: stats?.moderation.approved ?? 0, color: '#52c41a' },
      { title: 'Rejected', value: stats?.moderation.rejected ?? 0, color: '#ff4d4f' },
    ],
    [stats?.moderation],
  );

  const experimentColumns = [
    {
      title: 'Experiment',
      dataIndex: 'experiment',
      key: 'experiment',
      render: (value: string) => (
        <Space size={8}>
          <ExperimentOutlined />
          <span>{value}</span>
        </Space>
      ),
    },
    { title: 'Exposures', dataIndex: 'exposures', key: 'exposures', align: 'right' as const },
    { title: 'Conversions', dataIndex: 'conversions', key: 'conversions', align: 'right' as const },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      align: 'right' as const,
      render: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>
      <Space style={{ marginBottom: 16 }}>
        <Tag color={isCompact ? 'blue' : 'default'}>
          Layout Variant: {layoutLoading ? 'Loading…' : layoutVariant}
        </Tag>
        <Button size="small" disabled={layoutLoading || !layoutExperiment.variant} onClick={async () => {
          await layoutExperiment.recordConversion({ action: 'dashboard_reviewed' });
          message.success('Recorded dashboard review conversion');
        }}>
          Mark Dashboard Reviewed
        </Button>
      </Space>

      <Row gutter={primaryGutter}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Users" value={stats?.users.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Active Users (30d)" value={stats?.users.active30d ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="New Users (24h)" value={stats?.users.new24h ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Match Rate"
              value={stats?.matching?.matchRate ?? 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={primaryGutter} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Matches" value={stats?.matching?.totalMatches ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Likes" value={stats?.matching?.totalLikes ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Likes/User"
              value={stats?.matching?.averageLikesPerUser ?? 0}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Messages" value={stats?.messaging?.totalMessages ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Active Conversations" value={stats?.messaging?.activeConversations ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Avg Messages / Conversation"
              value={stats?.messaging?.averageMessagesPerConversation ?? 0}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="First Message Rate"
              value={stats?.messaging?.firstMessageRate ?? 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Title level={3} style={{ margin: '32px 0 16px' }}>Moderation Overview</Title>
      <Row gutter={secondaryGutter}>
        {moderationCards.map((card) => (
          <Col xs={12} sm={6} key={card.title}>
            <Card>
              <Statistic title={card.title} value={card.value} valueStyle={{ color: card.color }} />
            </Card>
          </Col>
        ))}
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
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 6 }} name="New Users" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={secondaryGutter} style={{ marginTop: 32 }}>
        <Col xs={24} md={12}>
          <Title level={3} style={{ margin: '0 0 16px' }}>Match Rate Trend (30 Days)</Title>
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={matchTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke="#8884d8" name="Likes" yAxisId="left" />
                <Line type="monotone" dataKey="matches" stroke="#82ca9d" name="Matches" yAxisId="left" />
                <Line type="monotone" dataKey="matchRate" stroke="#ff7300" name="Match Rate" dot={false} yAxisId="right" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Title level={3} style={{ margin: '0 0 16px' }}>Experiments (Last {stats?.experiments?.timeframeDays ?? 30} Days)</Title>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Total Exposures" value={stats?.experiments?.totals.exposures ?? 0} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Conversions" value={stats?.experiments?.totals.conversions ?? 0} />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Overall Conversion Rate"
                  value={(stats?.experiments?.totals.conversionRate ?? 0) * 100}
                  precision={2}
                  suffix="%"
                />
              </Col>
            </Row>
            <Table
              style={{ marginTop: 16 }}
              rowKey={(record) => record.experiment}
              columns={experimentColumns}
              dataSource={stats?.experiments.experiments ?? []}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
