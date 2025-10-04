import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Image, Button, Tag } from 'antd';
import api from '../services/api';

const ContentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({ photos: [], total: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const fetchPhotos = async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/photos', {
        params: { page, limit: pageSize },
      });
      setData({ photos: response.data.photos, total: response.data.total });
      setPagination({ current: response.data.page, pageSize: response.data.limit });
    } catch (err) {
      setError('Failed to fetch photos.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchPhotos(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: 'Photo',
      dataIndex: 'path',
      key: 'photo',
      render: (path: string) => <Image src={path} width={100} />,
    },
    {
      title: 'User ID',
      dataIndex: 'uid',
      key: 'uid',
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: 'NSFW',
      dataIndex: 'nsfw',
      key: 'nsfw',
      render: (nsfw: boolean) => (
        <Tag color={nsfw ? 'red' : 'green'}>{nsfw ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => <Button danger>Blind</Button>,
    },
  ];

  return (
    <div>
      <h1>Content & Image Management</h1>
      <p>This page displays a list of uploaded photos and allows for moderation.</p>
      {error && <Alert message={error} type="error" style={{ marginBottom: 24 }} />}
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={data.photos}
          columns={columns}
          rowKey="id"
          pagination={{
            ...pagination,
            total: data.total,
          }}
          onChange={handleTableChange}
        />
      )}
    </div>
  );
};

export default ContentManagement;
