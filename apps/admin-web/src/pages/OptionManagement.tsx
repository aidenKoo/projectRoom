
import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Modal, Form, Input, Select, message, Popconfirm, Tabs } from 'antd';
import api from '../services/api';

const { TabPane } = Tabs;

const OptionEditor: React.FC<{ category: string }> = ({ category }) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/survey-options/category/${category}`);
      setOptions(response.data);
    } catch (err) {
      setError(`Failed to fetch ${category} options.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [category]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingOption) {
        await api.put(`/survey-options/${editingOption.id}`, values);
        message.success('Option updated successfully');
      } else {
        await api.post('/survey-options', { ...values, category });
        message.success('Option added successfully');
      }
      setIsModalVisible(false);
      setEditingOption(null);
      fetchOptions();
    } catch (err) {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/survey-options/${id}`);
      message.success('Option deleted successfully');
      fetchOptions();
    } catch (err) {
      message.error('Failed to delete option');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Sort Order', dataIndex: 'sort_order', key: 'sort_order' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <span>
          <Button type="link" onClick={() => { setEditingOption(record); form.setFieldsValue(record); setIsModalVisible(true); }}>Edit</Button>
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div>
      <Button onClick={() => { setEditingOption(null); form.resetFields(); setIsModalVisible(true); }} type="primary" style={{ marginBottom: 16 }}>
        Add New Option
      </Button>
      <Table columns={columns} dataSource={options} rowKey="id" />
      <Modal
        title={editingOption ? 'Edit Option' : 'Add New Option'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical" name="option_form">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort Order" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const OptionManagement: React.FC = () => {
    return (
        <div>
            <h2 style={{ marginBottom: 16 }}>Survey Option Management</h2>
            <Tabs defaultActiveKey="hobby">
                <TabPane tab="Hobbies" key="hobby">
                    <OptionEditor category="hobby" />
                </TabPane>
                <TabPane tab="Jobs" key="job">
                    <OptionEditor category="job" />
                </TabPane>
                <TabPane tab="Education" key="education">
                    <OptionEditor category="education" />
                </TabPane>
            </Tabs>
        </div>
    );
};

export default OptionManagement;
