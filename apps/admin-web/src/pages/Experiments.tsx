import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message, Alert as AntAlert, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { fetchAbAssignments, fetchAbVariantCounts, forceAbAssignment, deleteAbAssignment, fetchAvailableExperiments, fetchMatchExperimentConfig, fetchAbStats, fetchExperimentRolloutConfig, updateExperimentRolloutConfig, fetchExperimentOverride, setExperimentOverride, deleteExperimentOverride, fetchExperimentSnapshots, captureExperimentSnapshot, fetchExperimentConfigHistory } from '../services/api';
import type { AbAssignment, ExperimentOverride } from '../services/api';
import { useExperimentAssignment } from '../hooks/useExperiment';

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 20;

const Experiments: React.FC = () => {
  const [experimentKey, setExperimentKey] = useState<string>('recencyBoost');
  const [availableExps, setAvailableExps] = useState<string[]>([]);
  const [configPreview, setConfigPreview] = useState<Record<string, any> | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm] = Form.useForm<{ configJson: string; auditReason: string }>();
  const [configSaving, setConfigSaving] = useState(false);
  const [variantFilter, setVariantFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<AbAssignment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<{ variants: Array<{ variant: string; exposures: number; conversions: number; conversionRate: number }>; totals: { exposures: number; conversions: number; conversionRate: number } } | null>(null);
  const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>(
    { current: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 },
  );
  const [snapshots, setSnapshots] = useState<Array<{ snapshotDate: string; experiment: string; exposures: number; conversions: number; conversionRate: number; capturedAt: string }>>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: number; experiment: string; changeType: string; payload?: Record<string, any>; actor?: string; reason?: string; recordedAt: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [forceOpen, setForceOpen] = useState(false);
  const [forceForm] = Form.useForm<{ userId: number; experiment: string; variant: string; auditReason: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AbAssignment | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('A/B assignment cleanup');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideForm] = Form.useForm<{ variant: string; ttlSeconds?: number; auditReason: string }>();
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideInfo, setOverrideInfo] = useState<ExperimentOverride | null>(null);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotForm] = Form.useForm<{ date?: string; auditReason: string }>();

  const layoutExperiment = useExperimentAssignment('experiments_page_layout', {
    variants: ['default', 'compact'],
    autoRecordExposure: true,
    platform: 'admin-web',
  });

  const layoutVariant = layoutExperiment.variant ?? 'default';
  const layoutLoading = layoutExperiment.loading;
  const isCompact = layoutVariant === 'compact';
  const primaryGutter: [number, number] = isCompact ? [12, 12] : [16, 16];

  const loadCounts = useCallback(async (exp: string) => {
    if (!exp) return;
    try {
      const res = await fetchAbVariantCounts(exp);
      setCounts(res.counts || {});
    } catch (e: any) {
      message.error(`Failed to load counts: ${e?.message || e}`);
    }
  }, []);

  const loadStats = useCallback(async (exp: string) => {
    if (!exp) return;
    try {
      const res = await fetchAbStats({ experiment: exp });
      setStats({ variants: res.variants, totals: res.totals });
    } catch (e: any) {
      message.error(`Failed to load stats: ${e?.message || e}`);
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

  const loadSnapshots = useCallback(async (exp: string) => {
    setSnapshotsLoading(true);
    try {
      const res = await fetchExperimentSnapshots({ experiment: exp, limit: 30 });
      setSnapshots(res.snapshots ?? []);
    } catch (e: any) {
      message.error(`Failed to load snapshots: ${e?.message || e}`);
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (exp: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetchExperimentConfigHistory({ experiment: exp, limit: 50 });
      setHistory(res.history ?? []);
    } catch (e: any) {
      message.error(`Failed to load history: ${e?.message || e}`);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const snapshotChartData = useMemo(
    () =>
      [...snapshots]
        .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
        .map((item) => ({
          date: item.snapshotDate,
          exposures: item.exposures,
          conversions: item.conversions,
          conversionRate: Number((item.conversionRate * 100).toFixed(2)),
        })),
    [snapshots],
  );

  const snapshotDropAlert = useMemo(() => {
    if (snapshotChartData.length < 2) return null;
    const latest = snapshotChartData[snapshotChartData.length - 1];
    const previous = snapshotChartData[snapshotChartData.length - 2];
    if (previous.conversionRate === 0) return null;
    const delta = latest.conversionRate - previous.conversionRate;
    const deltaPct = (delta / previous.conversionRate) * 100;
    if (deltaPct <= -20) {
      return `Conversion rate dropped ${Math.abs(deltaPct).toFixed(1)}% vs previous snapshot`;
    }
    return null;
  }, [snapshotChartData]);

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
        const res = await fetchMatchExperimentConfig(experimentKey);
        setConfigPreview(res.config || null);
      } catch {
        setConfigPreview(null);
      }
    })();
  }, [experimentKey]);

  const loadOverride = useCallback(
    async (exp: string, silent: boolean = true) => {
      try {
        const res = await fetchExperimentOverride(exp);
        const override = res.override ?? null;
        setOverrideInfo(override);
        return override;
      } catch (e: any) {
        setOverrideInfo(null);
        if (!silent) {
          message.error(`Failed to load override: ${e?.message || e}`);
        }
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    loadCounts(experimentKey);
    loadAssignments(1, DEFAULT_PAGE_SIZE, experimentKey, variantFilter);
    loadStats(experimentKey);
    loadOverride(experimentKey, true);
    loadSnapshots(experimentKey);
    loadHistory(experimentKey);
  }, [experimentKey, variantFilter, loadCounts, loadAssignments, loadStats, loadOverride, loadSnapshots, loadHistory]);

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

  const historyColumns: ColumnsType<(typeof history)[number]> = [
    { title: 'Timestamp', dataIndex: 'recordedAt', width: 180 },
    { title: 'Type', dataIndex: 'changeType', render: (type) => <Tag>{type}</Tag> },
    { title: 'Actor', dataIndex: 'actor', width: 140 },
    { title: 'Reason', dataIndex: 'reason', width: 220 },
    {
      title: 'Payload',
      dataIndex: 'payload',
      render: (payload: Record<string, any>) => (
        <pre style={{ margin: 0, maxHeight: 120, overflow: 'auto' }}>{payload ? JSON.stringify(payload, null, 2) : '-'}</pre>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={3}>A/B Experiments</Title>
      <Space>
        <Tag color={layoutVariant === 'compact' ? 'blue' : 'default'}>
          Layout Variant: {layoutLoading ? 'Loading…' : layoutVariant}
        </Tag>
        <Button size="small" disabled={layoutLoading || !layoutExperiment.variant} onClick={async () => {
          await layoutExperiment.recordConversion({ location: 'experiments_page' });
          message.success('Recorded conversion for experiments page');
        }}>
          Record Conversion
        </Button>
        <Button size="small" onClick={() => layoutExperiment.refresh()}>
          Refresh Variant
        </Button>
      </Space>

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
          <Button onClick={async () => {
            try {
              const res = await fetchExperimentRolloutConfig(experimentKey);
              const payload = res.config ?? { defaultVariant: 'A', variants: [{ key: 'A', weight: 1 }] };
              configForm.setFieldsValue({
                configJson: JSON.stringify(payload, null, 2),
                auditReason: '',
              });
              setConfigModalOpen(true);
            } catch (e: any) {
              message.error(`Failed to load rollout config: ${e?.message || e}`);
            }
          }}>Edit Rollout</Button>
          <Button onClick={async () => {
            const override = await loadOverride(experimentKey, false);
            overrideForm.setFieldsValue({
              variant: override?.variant ?? '',
              ttlSeconds: undefined,
              auditReason: '',
            });
            setOverrideModalOpen(true);
          }}>Override Variant</Button>
        </Space>
      </Card>

      {overrideInfo && (
        <Card>
          <Space direction="vertical">
            <Text strong>Active Override</Text>
            <Tag color="gold">Variant: {overrideInfo.variant}</Tag>
            {overrideInfo.expiresAt && (
              <Text type="secondary">Expires: {new Date(overrideInfo.expiresAt).toLocaleString()}</Text>
            )}
          </Space>
        </Card>
      )}

      {configPreview && (
        <Card title="Config Preview">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(configPreview, null, 2)}</pre>
        </Card>
      )}

      <Row gutter={primaryGutter}>
        {Object.keys(counts).map((k) => (
          <Col span={6} key={k}>
            <Card>
              <Statistic title={`Variant ${k}`} value={counts[k]} />
            </Card>
          </Col>
        ))}
      </Row>

      {stats && (
        <Card title="Variant Stats (exposures/conversions/CR)">
          <Row gutter={primaryGutter}>
            {stats.variants.map((v) => (
              <Col span={6} key={v.variant}>
                <Card>
                  <Space direction="vertical">
                    <Text strong>Variant {v.variant}</Text>
                    <Text>Exposures: {v.exposures}</Text>
                    <Text>Conversions: {v.conversions}</Text>
                    <Text>CR: {(v.conversionRate * 100).toFixed(2)}%</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        title="Experiment Snapshots (Last 30 days)"
        extra={
          <Space>
            <Button size="small" onClick={() => {
              snapshotForm.resetFields();
              setSnapshotModalOpen(true);
            }}>
              Capture Snapshot
            </Button>
            <Button size="small" onClick={() => loadSnapshots(experimentKey)}>
              Refresh
            </Button>
          </Space>
        }
      >
        {snapshotDropAlert && (
          <AntAlert type="warning" message={snapshotDropAlert} style={{ marginBottom: 12 }} />
        )}
        {snapshotsLoading ? (
          <Spin />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={snapshotChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="exposures" stroke="#1890ff" name="Exposures" yAxisId="left" />
              <Line type="monotone" dataKey="conversions" stroke="#52c41a" name="Conversions" yAxisId="left" />
              <Line type="monotone" dataKey="conversionRate" stroke="#fa541c" name="Conversion Rate (%)" yAxisId="right" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Config History">
        <Table
          rowKey={(record) => String(record.id)}
          columns={historyColumns}
          dataSource={history}
          loading={historyLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

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
        title="Capture Snapshot"
        open={snapshotModalOpen}
        onCancel={() => setSnapshotModalOpen(false)}
        okText="Capture"
        confirmLoading={snapshotSaving}
        onOk={async () => {
          try {
            const values = await snapshotForm.validateFields();
            setSnapshotSaving(true);
            await captureExperimentSnapshot({ date: values.date }, values.auditReason);
            message.success('Snapshot captured');
            setSnapshotModalOpen(false);
            setSnapshotSaving(false);
            loadSnapshots(experimentKey);
          } catch (error: any) {
            setSnapshotSaving(false);
            if (error?.errorFields) return;
            message.error(`Failed to capture snapshot: ${error?.message || error}`);
          }
        }}
      >
        <Form form={snapshotForm} layout="vertical" initialValues={{ auditReason: '' }}>
          <Form.Item name="date" label="Date (optional)">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="auditReason"
            label="Audit Reason"
            rules={[{ required: true, message: 'Provide audit reason' }]}
          >
            <Input.TextArea rows={3} maxLength={255} placeholder="Reason for snapshot execution" />
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

      <Modal
        title="Rollout Config"
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        okText="Save"
        confirmLoading={configSaving}
        width={720}
        onOk={async () => {
          try {
            const values = await configForm.validateFields();
            let parsed;
            try {
              parsed = JSON.parse(values.configJson);
            } catch (e: any) {
              message.error(`Invalid JSON: ${e?.message || e}`);
              return;
            }
            setConfigSaving(true);
            await updateExperimentRolloutConfig(experimentKey, parsed, values.auditReason);
            message.success('Rollout config saved');
            setConfigModalOpen(false);
            setConfigSaving(false);
            configForm.resetFields();
            loadCounts(experimentKey);
            loadStats(experimentKey);
            loadAssignments(pagination.current, pagination.pageSize, experimentKey, variantFilter);
          } catch (e: any) {
            setConfigSaving(false);
            if (e?.errorFields) return;
            message.error(`Failed to save config: ${e?.message || e}`);
          }
        }}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="configJson"
            label="Rollout Config JSON"
            rules={[{ required: true, message: 'Provide config JSON' }]}
          >
            <Input.TextArea autoSize={{ minRows: 12 }} spellCheck={false} placeholder="{ ... }" />
          </Form.Item>
          <Form.Item
            name="auditReason"
            label="Audit Reason"
            rules={[{ required: true, message: 'Provide audit reason' }]}
          >
            <Input.TextArea rows={3} maxLength={255} placeholder="Reason for rollout update" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Experiment Override"
        open={overrideModalOpen}
        onCancel={() => setOverrideModalOpen(false)}
        okText="Save Override"
        confirmLoading={overrideSaving}
        onOk={async () => {
          try {
            const values = await overrideForm.validateFields();
            setOverrideSaving(true);
            const response = await setExperimentOverride(
              {
                experiment: experimentKey,
                variant: values.variant,
                ttlSeconds: values.ttlSeconds,
              },
              values.auditReason,
            );
            message.success('Override saved');
            setOverrideInfo(response.override);
            setOverrideModalOpen(false);
            setOverrideSaving(false);
            loadAssignments(pagination.current, pagination.pageSize, experimentKey, variantFilter);
            loadStats(experimentKey);
          } catch (error: any) {
            setOverrideSaving(false);
            if (error?.errorFields) return; // validation error
            message.error(`Failed to save override: ${error?.message || error}`);
          }
        }}
      >
        <Form
          form={overrideForm}
          layout="vertical"
          initialValues={{ variant: overrideInfo?.variant ?? '', ttlSeconds: undefined, auditReason: '' }}
        >
          <Form.Item
            name="variant"
            label="Variant"
            rules={[{ required: true, message: 'Enter variant key' }]}
          >
            <Input placeholder="Variant key" />
          </Form.Item>
          <Form.Item
            name="ttlSeconds"
            label="TTL (seconds)"
            tooltip="Optional. Leave empty for no expiration."
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 3600" />
          </Form.Item>
          <Form.Item
            name="auditReason"
            label="Audit Reason"
            rules={[{ required: true, message: 'Provide audit reason' }]}
          >
            <Input.TextArea rows={3} maxLength={255} placeholder="Explain why override is needed" />
          </Form.Item>
          {overrideInfo && (
            <Button
              danger
              onClick={async () => {
                try {
                  const values = await overrideForm.validateFields([ 'auditReason' ]);
                  setOverrideSaving(true);
                  await deleteExperimentOverride(experimentKey, values.auditReason);
                  message.success('Override cleared');
                  setOverrideInfo(null);
                  setOverrideModalOpen(false);
                  setOverrideSaving(false);
                  loadAssignments(pagination.current, pagination.pageSize, experimentKey, variantFilter);
                  loadStats(experimentKey);
                } catch (error: any) {
                  setOverrideSaving(false);
                  if (error?.errorFields) return;
                  message.error(`Failed to clear override: ${error?.message || error}`);
                }
              }}
            >
              Clear Override
            </Button>
          )}
        </Form>
      </Modal>
    </Space>
  );
};

export default Experiments;
