import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchAbAssignments, fetchAbVariantCounts, forceAbAssignment, deleteAbAssignment, fetchAvailableExperiments, fetchExperimentConfig } from '../services/api';
import type { AbAssignment } from '../services/api';

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 20;

const Experiments: React.FC = () => {
  const [experimentKey, setExperimentKey] = useState<string>('recencyBoost');
  const [availableExps, setAvailableExps] = useState<string[]>([]);
  const [configPreview, setConfigPreview] = useState<Record<string, any> | null>(null);
  const [variantFilter, setVariantFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<AbAssignment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>(
    { current: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 },
  );

  const [forceOpen, setForceOpen] = useState(false);
  const [forceForm] = Form.useForm<{ userId: number; experiment: string; variant: string; auditReason: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AbAssignment | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('A/B assignment cleanup');

  const loadCounts = useCallback(async (exp: string) => {
    if (!exp) return;
    try {
      const res = await fetchAbVariantCounts(exp);
      setCounts(res.counts || {});
    } catch (e: any) {
      message.error(`Failed to load counts: ${e?.message || e}`);
    }
  }, []);

  const loadAssignments = useCallback(async (page: number, pageSize: number, exp: string, variant?: string) => {
    setLoading(true);
    try {
      const data = await fetchAbAssignments({ experiment: exp, variant, page, limit: pageSize });
      setAssignments(data.items);
      setPagination({ current: data.page, pageSize: data.limit, total: data.total });
    } catch (e: any) {
      message.error(`Failed to load assignments: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // load available experiments
    fetchAvailableExperiments()
      .then((r) => setAvailableExps(r.available || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // load config preview
    (async () => {
      try {
        const res = await fetchExperimentConfig(experimentKey);
        setConfigPreview(res.config || null);
      } catch {
        setConfigPreview(null);
      }
    })();
  }, [experimentKey]);

  useEffect(() => {
    loadCounts(experimentKey);
    loadAssignments(1, DEFAULT_PAGE_SIZE, experimentKey, variantFilter);
  }, [experimentKey, variantFilter, loadCounts, loadAssignments]);

  const variantOptions = useMemo(() => {
    const keys = Object.keys(counts);
    return keys.map((k) => ({ label: `${k} (${counts[k]})`, value: k }));
  }, [counts]);

  const columns: ColumnsType<AbAssignment> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'User ID', dataIndex: 'userId', width: 100 },
    { title: 'Experiment', dataIndex: 'experiment' },
    { title: 'Variant', dataIndex: 'variant', render: (v) => <Tag color="geekblue">{v}</Tag> },
    { title: 'Assigned At', dataIndex: 'assignedAt' },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button danger size="small" onClick={() => { setDeleteTarget(record); setDeleteOpen(true); }}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={3}>A/B Experiments</Title>

      <Card>
        <Space wrap>
          <Select
            showSearch
            style={{ minWidth: 280 }}
            value={experimentKey}
            options={availableExps.map((k) => ({ label: k, value: k }))}
            onChange={(v) => setExperimentKey(v)}
            placeholder="Select experiment key"
          />
          <Select
            allowClear
            placeholder="Variant filter"
            style={{ minWidth: 200 }}
            options={variantOptions}
            value={variantFilter}
            onChange={(v) => setVariantFilter(v)}
          />
          <Button type="primary" onClick={() => setForceOpen(true)}>Force Assign</Button>
        </Space>
      </Card>

      {configPreview && (
        <Card title="Config Preview">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(configPreview, null, 2)}</pre>
        </Card>
      )}

      <Row gutter={16}>
        {Object.keys(counts).map((k) => (
          <Col span={6} key={k}>
            <Card>
              <Statistic title={`Variant ${k}`} value={counts[k]} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={assignments}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              loadAssignments(page, pageSize, experimentKey, variantFilter);
            },
          }}
        />
      </Card>

      <Modal
        title="Force Assign User"
        open={forceOpen}
        onCancel={() => setForceOpen(false)}
        okText="Assign"
        onOk={async () => {
          try {
            const values = await forceForm.validateFields();
            setSubmitting(true);
            await forceAbAssignment({ userId: Number(values.userId), experiment: values.experiment, variant: values.variant }, values.auditReason);
            message.success('Assigned');
            setForceOpen(false);
            forceForm.resetFields();
            loadCounts(experimentKey);
            loadAssignments(pagination.current, pagination.pageSize, experimentKey, variantFilter);
          } catch (e: any) {
            if (e?.errorFields) return; // form errors
            message.error(`Assign failed: ${e?.message || e}`);
          } finally {
            setSubmitting(false);
          }
        }}
        confirmLoading={submitting}
      >
        <Form form={forceForm} layout="vertical" initialValues={{ experiment: experimentKey, auditReason: 'A/B admin force assignment' }}>
          <Form.Item name="userId" label="User ID" rules={[{ required: true, message: 'Enter user ID' }]}>
            <Input type="number" placeholder="e.g., 123" />
          </Form.Item>
          <Form.Item name="experiment" label="Experiment" rules={[{ required: true }]}>
            <Input placeholder="e.g., recencyBoost" />
          </Form.Item>
          <Form.Item name="variant" label="Variant" rules={[{ required: true }]}>
            <Input placeholder="e.g., A or B" />
          </Form.Item>
          <Form.Item name="auditReason" label="Audit Reason" rules={[{ required: true, message: 'Provide audit reason' }]}>
            <Input placeholder="Reason for force assignment" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Delete Assignment"
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        onOk={async () => {
          if (!deleteTarget) return;
          try {
            await deleteAbAssignment(deleteTarget.id, deleteReason);
            message.success('Deleted');
            setDeleteOpen(false);
            setDeleteTarget(null);
            loadCounts(experimentKey);
            loadAssignments(pagination.current, pagination.pageSize, experimentKey, variantFilter);
          } catch (e: any) {
            message.error(`Delete failed: ${e?.message || e}`);
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Provide audit reason for deletion.</Text>
          <Input value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} maxLength={255} />
        </Space>
      </Modal>
    </Space>
  );
};

export default Experiments;
