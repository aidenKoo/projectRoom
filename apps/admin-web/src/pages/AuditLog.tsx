
import React, { useState, useEffect } from 'react';
import { Table, Alert, Typography, Tag, Select, Input, Space } from 'antd';
import api from '../services/api';

const { Title } = Typography;
const ACTION_OPTIONS = [
  'READ_PRIVATE_PROFILE',
  'UPDATE_SENSITIVE_DATA',
  'DELETE_USER',
];

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [targetFilter, setTargetFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const fetchLogs = async (page = 1, pageSize = 15, action?: string, targetUid?: string, actorUid?: string) => {
    try {
      setLoading(true);
      const response = await api.get('/audit-logs', {
        params: {
          page,
          limit: pageSize,
          action,
          targetUid,
          actorUid,
        },
      });
      const items = response.data?.items ?? [];
      const meta = response.data?.meta ?? {
        currentPage: page,
        itemsPerPage: pageSize,
        totalItems: response.data?.total ?? items.length,
      };
      setLogs(items);
      setPagination({
        current: meta.currentPage,
        pageSize: meta.itemsPerPage,
        total: meta.totalItems,
      });
    } catch (err) {
      setError('Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(
      pagination.current,
      pagination.pageSize,
      actionFilter,
      targetFilter || undefined,
      actorFilter || undefined,
    );
  }, [pagination.current, pagination.pageSize, actionFilter, targetFilter, actorFilter]);

  useEffect(() => {
    setPagination((prev) => (prev.current === 1 ? prev : { ...prev, current: 1 }));
  }, [actionFilter, targetFilter, actorFilter]);

  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total || 0,
    });
  };

  const columns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: (text: string) => new Date(text).toLocaleString() },
    { title: 'Actor UID', dataIndex: 'accessorId', key: 'accessorId' },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (action: string) => <Tag color="geekblue">{action}</Tag> },
    { title: 'Target', dataIndex: 'targetUserId', key: 'targetUserId' },
    { title: 'Reason', dataIndex: ['details', 'reason'], key: 'reason', render: (reason: string) => reason || '—' },
    { title: 'Resource', dataIndex: ['details', 'targetResource'], key: 'targetResource', render: (value: string) => value || '—' },
    { title: 'IP', dataIndex: ['details', 'ip'], key: 'ip', render: (value: string) => value || '—' },
    { title: 'Request ID', dataIndex: ['details', 'requestId'], key: 'requestId', render: (value: string) => value || '—' },
  ];

  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Audit Logs</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Action filter"
          value={actionFilter}
          onChange={(value) => setActionFilter(value || undefined)}
          style={{ width: 220 }}
          options={ACTION_OPTIONS.map((action) => ({ value: action, label: action }))}
        />
        <Input
          placeholder="Target UID"
          value={targetFilter}
          onChange={(event) => setTargetFilter(event.target.value)}
          allowClear
          style={{ width: 220 }}
        />
        <Input
          placeholder="Actor UID"
          value={actorFilter}
          onChange={(event) => setActorFilter(event.target.value)}
          allowClear
          style={{ width: 220 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default AuditLog;
