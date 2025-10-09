
import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Modal, Form, Input, message, Tabs, Typography, Tag } from 'antd';
import api from '../services/api';

const { TabPane } = Tabs;
const { Text } = Typography;

type OptionRecord = {
  id: number;
  label?: string | null;
  value: string;
  sortOrder: number;
  isActive: boolean;
};

const OptionEditor: React.FC<{ category: string }> = ({ category }) => {
  const [options, setOptions] = useState<OptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonTargetId, setReasonTargetId] = useState<number | null>(null);
  const [auditReasonText, setAuditReasonText] = useState('');
  const [auditReasonError, setAuditReasonError] = useState('');
  const [reasonSubmitting, setReasonSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/survey-options/category/${category}`);
      setOptions(response.data ?? []);
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
      const { auditReason, sortOrder, ...rest } = values;
      const trimmedReason = auditReason.trim();
      const payload = {
        ...rest,
        sortOrder: Number(sortOrder),
      };

      const headers = {
        'X-Audit-Reason': trimmedReason,
      };

      if (editingOption) {
        await api.put(`/survey-options/${editingOption.id}`, payload, {
          headers,
        });
        message.success('Option updated successfully');
      } else {
        await api.post('/survey-options', { ...payload, category }, { headers });
        message.success('Option added successfully');
      }
      setIsModalVisible(false);
      setEditingOption(null);
      fetchOptions();
    } catch (err) {
      message.error('Operation failed');
    }
  };

  const openCreateModal = () => {
    setEditingOption(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0,
      auditReason: '',
    });
    setIsModalVisible(true);
  };

  const openEditModal = (record: OptionRecord) => {
    setEditingOption(record);
    form.resetFields();
    form.setFieldsValue({
      label: record.label ?? '',
      value: record.value,
      sortOrder: record.sortOrder,
      auditReason: '',
    });
    setIsModalVisible(true);
  };

  const openDeleteModal = (id: number) => {
    setReasonTargetId(id);
    setAuditReasonText('');
    setAuditReasonError('');
    setReasonModalVisible(true);
  };

  const confirmDelete = async () => {
    if (reasonTargetId == null) return;
    const trimmed = auditReasonText.trim();
    if (!trimmed) {
      setAuditReasonError('Please provide the reason for deleting this option.');
      return;
    }
    setReasonSubmitting(true);
    try {
      await api.delete(`/survey-options/${reasonTargetId}`, {
        headers: { 'X-Audit-Reason': trimmed },
      });
      message.success('Option deleted successfully');
      setReasonModalVisible(false);
      setAuditReasonText('');
      fetchOptions();
    } catch (err) {
      message.error('Failed to delete option');
    } finally {
      setReasonSubmitting(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Sort Order', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: OptionRecord) => (
        <span>
          <Button type="link" onClick={() => openEditModal(record)}>Edit</Button>
          <Button type="link" danger onClick={() => openDeleteModal(record.id)}>Delete</Button>
        </span>
      ),
    },
  ];

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div>
      <Button onClick={openCreateModal} type="primary" style={{ marginBottom: 16 }}>
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
          <Form.Item name="sortOrder" label="Sort Order" rules={[{ required: true }]}> 
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="auditReason"
            label="Audit Reason"
            rules={[{ required: true, message: 'Please provide a reason for this change.' }]}
          >
            <Input.TextArea rows={3} maxLength={255} placeholder="Explain why this option is being added or updated." />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Access Reason Required"
        visible={reasonModalVisible}
        onOk={confirmDelete}
        okText="Delete"
        confirmLoading={reasonSubmitting}
        onCancel={() => {
          if (!reasonSubmitting) {
            setReasonModalVisible(false);
            setAuditReasonText('');
            setAuditReasonError('');
            setReasonTargetId(null);
          }
        }}
        cancelButtonProps={{ disabled: reasonSubmitting }}
      >
        <p>Please describe why you are deleting this option.</p>
        <Input.TextArea
          rows={3}
          maxLength={255}
          value={auditReasonText}
          onChange={(event) => {
            setAuditReasonText(event.target.value);
            if (auditReasonError) {
              setAuditReasonError('');
            }
          }}
          placeholder="e.g., Option deprecated per new survey structure"
        />
        {auditReasonError && (
          <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {auditReasonError}
          </Text>
        )}
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
