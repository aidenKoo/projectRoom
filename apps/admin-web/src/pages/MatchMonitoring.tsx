import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api, { fetchMatchQueue } from '../services/api';
import type { MatchQueueRecommendation, MatchQueueResponse } from '../services/api';

const { Title, Text } = Typography;

type AdminUserItem = {
  firebase_uid: string;
  email: string;
  display_name?: string | null;
  region_code?: string | null;
};

type UserOption = {
  uid: string;
  label: string;
  email: string;
  displayName: string | null;
  regionCode: string | null;
};

const WAIT_FETCH_DELAY_MS = 350;

const formatMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes) || minutes < 1) {
    return '<1m';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-CA', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return value;
  }
};

const extractTopSignals = (
  breakdown: Record<string, unknown> | null,
): { key: string; score: number }[] => {
  if (!breakdown || typeof breakdown !== 'object') {
    return [];
  }
  const entries: { key: string; score: number }[] = [];
  for (const [key, value] of Object.entries(breakdown)) {
    if (typeof value === 'number') {
      entries.push({ key, score: Number(value) });
      continue;
    }
    if (value && typeof value === 'object' && 'score' in value) {
      const score = Number((value as Record<string, unknown>).score ?? 0);
      entries.push({ key, score });
    }
  }
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, 3);
};

const statusColorMap: Record<MatchQueueRecommendation['status'], string> = {
  queued: 'blue',
  shown: 'green',
  skipped: 'red',
};

const MatchMonitoring: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [queueData, setQueueData] = useState<MatchQueueResponse | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setUserOptions([]);
      return;
    }
    setLoadingUsers(true);
    const handle = window.setTimeout(async () => {
      try {
        const response = await api.get('/admin/users', {
          params: { search: searchQuery.trim(), limit: 8, page: 1 },
        });
        const items: AdminUserItem[] = response.data?.items ?? [];
        const mapped = items.map<UserOption>((item) => ({
          uid: item.firebase_uid,
          label: `${item.display_name ?? '(No name)'} · ${item.email}`,
          email: item.email,
          displayName: item.display_name ?? null,
          regionCode: item.region_code ?? null,
        }));
        setUserOptions(mapped);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoadingUsers(false);
      }
    }, WAIT_FETCH_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  const handleSelectUser = async (userId: string) => {
    const option = userOptions.find((item) => item.uid === userId);
    setSelectedUser(option ?? null);
    setLoadingQueue(true);
    setError('');
    try {
      const data = await fetchMatchQueue({ userId });
      setQueueData(data);
    } catch (err) {
      console.error('Failed to fetch match queue', err);
      setError('Failed to load match queue. Please try again.');
      setQueueData(null);
    } finally {
      setLoadingQueue(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!queueData) {
      return null;
    }
    const { stats } = queueData;
    return (
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Recommendations" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Queued" value={stats.queued} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Shown" value={stats.shown} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Skipped" value={stats.skipped} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Stale (>72h)" value={stats.stale} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Score"
              value={Number.isFinite(stats.avgScore) ? (stats.avgScore * 100).toFixed(1) : '0.0'}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="p95 Wait"
              value={formatMinutes(stats.p95WaitMinutes)}
            />
          </Card>
        </Col>
      </Row>
    );
  }, [queueData]);

  const columns: ColumnsType<MatchQueueRecommendation> = useMemo(
    () => [
      {
        title: 'Candidate',
        dataIndex: 'targetProfile',
        key: 'candidate',
        render: (_: unknown, record: MatchQueueRecommendation) => {
          const profile = record.targetProfile;
          const owner = record.baseProfile;
          return (
            <Space direction="vertical" size={2}>
              <Text strong>{profile?.name ?? record.targetUserId}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {profile?.email ?? 'unknown'} · {profile?.regionCode ?? 'N/A'}
              </Text>
              {owner?.uid && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Viewer: {owner.name ?? owner.uid}
                </Text>
              )}
            </Space>
          );
        },
      },
      {
        title: 'Score',
        dataIndex: 'score',
        key: 'score',
        render: (score: number) => `${(score * 100).toFixed(1)}%`,
        sorter: (a: MatchQueueRecommendation, b: MatchQueueRecommendation) => a.score - b.score,
        defaultSortOrder: 'descend' as const,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: MatchQueueRecommendation['status']) => (
          <Tag color={statusColorMap[status]} style={{ textTransform: 'capitalize' }}>
            {status}
          </Tag>
        ),
        filters: [
          { text: 'Queued', value: 'queued' },
          { text: 'Shown', value: 'shown' },
          { text: 'Skipped', value: 'skipped' },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: 'Wait',
        dataIndex: 'waitMinutes',
        key: 'waitMinutes',
        render: (minutes: number) => formatMinutes(minutes),
        sorter: (a: MatchQueueRecommendation, b: MatchQueueRecommendation) =>
          a.waitMinutes - b.waitMinutes,
      },
      {
        title: 'Signals',
        dataIndex: 'scoreBreakdown',
        key: 'signals',
        render: (breakdown: MatchQueueRecommendation['scoreBreakdown']) => {
          const signals = extractTopSignals(breakdown);
          if (signals.length === 0) {
            return <Text type="secondary">-</Text>;
          }
          return (
            <Space size={[4, 4]} wrap>
              {signals.map((item) => (
                <Tag key={item.key}>
                  {item.key} · {(item.score * 100).toFixed(0)}%
                </Tag>
              ))}
            </Space>
          );
        },
      },
      {
        title: 'Shared Bits',
        dataIndex: 'sharedBits',
        key: 'sharedBits',
        render: (sharedBits: string[] | null) => {
          if (!sharedBits || sharedBits.length === 0) {
            return <Text type="secondary">-</Text>;
          }
          return (
            <Space size={[4, 4]} wrap>
              {sharedBits.map((bit) => (
                <Tag key={bit}>{bit}</Tag>
              ))}
            </Space>
          );
        },
      },
      {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (reason: string | null) => reason ?? '-',
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: 'Shown',
        dataIndex: 'shownAt',
        key: 'shownAt',
        render: (value: string | null) => formatDateTime(value),
      },
    ],
    [],
  );

  return (
    <div>
      <Title level={2} style={{ marginBottom: 16 }}>
        Match Queue Monitoring
      </Title>
      <Text>
        Inspect recommendation queues per user and track stale candidates as defined in 작업서 §6.1.
      </Text>

      <Space style={{ marginTop: 24 }} size="large" wrap>
        <div>
          <Text strong>Search User</Text>
          <Select
            showSearch
            allowClear
            style={{ minWidth: 320, marginTop: 8 }}
            placeholder="Type email or name (min 2 characters)"
            defaultActiveFirstOption={false}
            filterOption={false}
            notFoundContent={loadingUsers ? <Spin size="small" /> : null}
            onSearch={setSearchQuery}
            onClear={() => {
              setSelectedUser(null);
              setQueueData(null);
            }}
            onSelect={(value: string) => handleSelectUser(value)}
            value={selectedUser?.uid}
            options={userOptions.map((option) => ({
              value: option.uid,
              label: option.label,
            }))}
          />
        </div>
        {queueData?.owner && (
          <Card size="small">
            <Space direction="vertical" size={2}>
              <Text type="secondary">Current Viewer</Text>
              <Text strong>{queueData.owner.name ?? queueData.owner.uid}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {queueData.owner.email} · {queueData.owner.regionCode ?? 'N/A'}
              </Text>
            </Space>
          </Card>
        )}
      </Space>

      {error && (
        <Alert
          style={{ marginTop: 24 }}
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {summaryCards}

      <Card style={{ marginTop: 24 }} bodyStyle={{ padding: 16 }}>
        {loadingQueue ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
            <Spin size="large" />
          </div>
        ) : !queueData ? (
          <Empty description="Select a user to view their recommendation queue." />
        ) : queueData.recommendations.length === 0 ? (
          <Empty description="No recommendations found for this user." />
        ) : (
          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={queueData.recommendations}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 960 }}
          />
        )}
      </Card>

      {queueData?.owner && (
        <Card style={{ marginTop: 24 }} size="small" title="Viewer Snapshot">
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="UID">{queueData.owner.uid}</Descriptions.Item>
            <Descriptions.Item label="Email">{queueData.owner.email}</Descriptions.Item>
            <Descriptions.Item label="Region">{queueData.owner.regionCode ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Age">
              {queueData.owner.age !== null ? `${queueData.owner.age}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Job Group">
              {queueData.owner.jobGroup ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Education">
              {queueData.owner.education ?? '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default MatchMonitoring;
