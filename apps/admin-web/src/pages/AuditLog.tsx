
import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Typography, Tag } from 'antd';
import api from '../services/api';

const { Title } = Typography;

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  const fetchLogs = async (page = 1, pageSize = 15) => {
    try {
      setLoading(true);
      const response = await api.get('/audit-logs', {
        params: { page, limit: pageSize },
      });
      setLogs(response.data.items);
      setPagination({
        current: response.data.meta.currentPage,
        pageSize: response.data.meta.itemsPerPage,
        total: response.data.meta.totalItems,
      });
    } catch (err) {
      setError('Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const columns = [
    { title: 'Timestamp', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() },
    { title: 'Actor UID', dataIndex: 'actor_uid', key: 'actor_uid' },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (action: string) => <Tag color="geekblue">{action}</Tag> },
    { title: 'Target', dataIndex: 'target', key: 'target' },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    { title: 'IP Address', dataIndex: ['metadata', 'ip'], key: 'ip' },
  ];

  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Audit Logs</Title>
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
