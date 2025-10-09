
import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Alert, Tag, message, Modal, Input, Typography } from 'antd';
import api from '../services/api';

const CodeManagement: React.FC = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [auditReason, setAuditReason] = useState('');
  const [auditReasonError, setAuditReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/codes');
      setCodes(response.data);
    } catch (err) {
      setError('Failed to fetch codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerateCode = () => {
    setAuditReason('');
    setAuditReasonError('');
    setReasonModalVisible(true);
  };

  const confirmGenerateCode = async () => {
    const trimmedReason = auditReason.trim();
    if (!trimmedReason) {
      setAuditReasonError('Please describe why you are generating a new code.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/codes/generate', null, {
        headers: {
          'X-Audit-Reason': trimmedReason,
        },
      });
      message.success('New code generated successfully!');
      setReasonModalVisible(false);
      setAuditReason('');
      fetchCodes();
    } catch (err) {
      message.error('Failed to generate new code.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (text: string) => <Tag color="purple">{text}</Tag> },
    { title: 'Month', dataIndex: 'month', key: 'month', render: (text: string) => new Date(text).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' }) },
    { title: 'Max Uses', dataIndex: 'max_uses', key: 'max_uses', render: (text: number | null) => text || 'Unlimited' },
    { title: 'Used Count', dataIndex: 'used_count', key: 'used_count' },
    { title: 'Active', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'YES' : 'NO'}</Tag> },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() },
  ];

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Code Management</h2>
        <Button type="primary" onClick={handleGenerateCode}>Generate New Code</Button>
      </div>
      <Table columns={columns} dataSource={codes} rowKey="id" />
      <Modal
        title="Access Reason Required"
        visible={reasonModalVisible}
        onOk={confirmGenerateCode}
        okText="Generate"
        confirmLoading={submitting}
        onCancel={() => {
          if (!submitting) {
            setReasonModalVisible(false);
            setAuditReason('');
            setAuditReasonError('');
          }
        }}
        cancelButtonProps={{ disabled: submitting }}
      >
        <p>Please state the reason for generating a new monthly code.</p>
        <Input.TextArea
          rows={3}
          maxLength={255}
          value={auditReason}
          onChange={(event) => {
            setAuditReason(event.target.value);
            if (auditReasonError) {
              setAuditReasonError('');
            }
          }}
          placeholder="e.g., Monthly onboarding campaign reset"
        />
        {auditReasonError && (
          <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {auditReasonError}
          </Typography.Text>
        )}
      </Modal>
    </div>
  );
};

export default CodeManagement;
