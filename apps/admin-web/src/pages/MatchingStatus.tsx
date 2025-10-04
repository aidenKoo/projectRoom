import React, { useState } from 'react';
import { Input, Button, Table, Spin, Alert } from 'antd';
import api from '../services/api';

const MatchingStatus: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!userId) {
      setError('Please enter a User ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/match/queue', { params: { userId } });
      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch matching status.');
      console.error(err);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Target User ID',
      dataIndex: 'targetUserId',
      key: 'targetUserId',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: any, b: any) => a.score - b.score,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
  ];

  return (
    <div>
      <h1>Matching Status</h1>
      <p>Enter a User ID to see their recommendation queue.</p>
      <Input.Search
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        onSearch={handleSearch}
        enterButton="Search"
        style={{ width: 400, marginBottom: 24 }}
      />
      {error && <Alert message={error} type="error" style={{ marginBottom: 24 }} />}
      {loading ? (
        <Spin />
      ) : (
        <Table dataSource={results} columns={columns} rowKey="targetUserId" />
      )}
    </div>
  );
};

export default MatchingStatus;
