import React, { useState, useEffect } from 'react';
import { Table, Input, Spin, Alert, Modal, Descriptions, Tag, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import api from '../services/api';
import { debounce } from 'lodash';

const { Title, Text } = Typography;
const { Search } = Input;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { page, limit: pageSize, search },
      });
      setUsers(response.data.items);
      setPagination({
        current: response.data.meta.currentPage,
        pageSize: response.data.meta.itemsPerPage,
        total: response.data.meta.totalItems,
      });
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize, searchTerm);
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setPagination({ ...pagination, current: 1 }); // Reset to first page on search
  }, 500);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const showUserDetails = async (userId: string) => {
    try {
      setModalLoading(true);
      setIsModalVisible(true);
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data);
    } catch (error) {
      setError('Failed to fetch user details.');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid', width: 150 },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Name', dataIndex: ['profile', 'name'], key: 'name' },
    { title: 'Age', dataIndex: ['profile', 'age'], key: 'age' },
    { title: 'Region', dataIndex: ['profile', 'region_code'], key: 'region' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <a onClick={() => showUserDetails(record.uid)}>View Details</a>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>User Management</Title>
      <Search
        placeholder="Search by email or name"
        onChange={handleSearch}
        style={{ marginBottom: 20, width: 300 }}
      />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="uid"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
      <Modal
        title="User Details"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[<Button key="back" onClick={() => setIsModalVisible(false)}>Close</Button>]}
      >
        {modalLoading ? <Spin /> : (
          selectedUser && <div>
            <Title level={4}>Public Profile</Title>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Name">{selectedUser.profile?.name}</Descriptions.Item>
              <Descriptions.Item label="Age">{selectedUser.profile?.age}</Descriptions.Item>
              <Descriptions.Item label="Height">{selectedUser.profile?.height_cm} cm</Descriptions.Item>
              <Descriptions.Item label="Job">{selectedUser.profile?.job}</Descriptions.Item>
              <Descriptions.Item label="Education">{selectedUser.profile?.education}</Descriptions.Item>
              <Descriptions.Item label="Region">{selectedUser.profile?.region_code}</Descriptions.Item>
              <Descriptions.Item label="MBTI">{selectedUser.profile?.mbti?.join(', ')}</Descriptions.Item>
              <Descriptions.Item label="Hobbies">{selectedUser.profile?.hobbies?.join(', ')}</Descriptions.Item>
              <Descriptions.Item label="Bio" span={2}>{selectedUser.profile?.bio_highlight}</Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{marginTop: 24}}>Private Profile</Title>
            <Descriptions bordered column={2}>
                <Descriptions.Item label="Wealth Level"><Tag color="blue">{selectedUser.privateProfile?.wealth_level}</Tag></Descriptions.Item>
                <Descriptions.Item label="Look Confidence">{selectedUser.privateProfile?.look_confidence} / 5</Descriptions.Item>
                <Descriptions.Item label="Body Confidence">{selectedUser.privateProfile?.body_confidence} / 5</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;