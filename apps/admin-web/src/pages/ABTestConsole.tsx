import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Button, Tag } from 'antd';
import api from '../services/api';

const ABTestConsole: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState([]);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/ab-tests');
      setTests(response.data);
    } catch (err) {
      setError('Failed to fetch A/B tests.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const columns = [
    {
      title: 'Test Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Variants',
      dataIndex: 'variants',
      key: 'variants',
      render: (variants: any) => (
        <pre>{JSON.stringify(variants, null, 2)}</pre>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <>
          <Button style={{ marginRight: 8 }}>Edit</Button>
          <Button danger>Deactivate</Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <h1>A/B Test Console</h1>
      <p>This page displays and allows management of A/B tests.</p>
      {error && <Alert message={error} type="error" style={{ marginBottom: 24 }} />}
      {loading ? (
        <Spin />
      ) : (
        <Table dataSource={tests} columns={columns} rowKey="id" />
      )}
    </div>
  );
};

export default ABTestConsole;
