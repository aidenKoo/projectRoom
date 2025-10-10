import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  fetchAuditLogs,
  fetchPhotoModerationQueue,
  moderatePhotoDecision,
} from '../services/api';
import type {
  AuditLogEntry,
  ModerationPhotoRecord,
  ModerationPhotoResponse,
} from '../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DEFAULT_PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: ModerationPhotoRecord['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'blue' },
  { value: 'auto_flagged', label: 'Auto-Flagged', color: 'orange' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];

type DateRange = [Dayjs | null, Dayjs | null] | null;

type FilterState = {
  statuses: string[];
  search: string;
  dateRange: DateRange;
};

type ModerationSummary = {
  total: number;
  pending: number;
  autoFlagged: number;
  approved: number;
  rejected: number;
};

const statusTag = (status: ModerationPhotoRecord['status']) => {
  const entry = STATUS_OPTIONS.find((option) => option.value === status);
  if (!entry) {
    return <Tag>{status}</Tag>;
  }
  return (
    <Tag color={entry.color} style={{ textTransform: 'capitalize' }}>
      {entry.label}
    </Tag>
  );
};

const nsfwTag = (record: ModerationPhotoRecord) => {
  if (!record.nsfw) {
    return <Tag color="green">Safe</Tag>;
  }
  const confidence = record.nsfwScore != null ? `${Math.round(record.nsfwScore * 100)}%` : 'Unknown';
  return <Tag color="red">NSFW · {confidence}</Tag>;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value;
};

const getSummary = (records: ModerationPhotoRecord[]): ModerationSummary => {
  return records.reduce<ModerationSummary>(
    (acc, record) => {
      acc.total += 1;
      if (record.status === 'pending') acc.pending += 1;
      if (record.status === 'auto_flagged') acc.autoFlagged += 1;
      if (record.status === 'approved') acc.approved += 1;
      if (record.status === 'rejected') acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, autoFlagged: 0, approved: 0, rejected: 0 },
  );
};

const renderDetailValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((item) => renderDetailValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const PhotoModeration: React.FC = () => {
  const [records, setRecords] = useState<ModerationPhotoRecord[]>([]);
  const [summary, setSummary] = useState<ModerationSummary>({
    total: 0,
    pending: 0,
    autoFlagged: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['pending', 'auto_flagged'],
    search: '',
    dateRange: null,
  });
  const [searchValue, setSearchValue] = useState<string>('');
  const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>(
    {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
    },
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ModerationPhotoRecord | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [submitting, setSubmitting] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [form] = Form.useForm<{ auditReason: string; note?: string }>();

  const loadPhotos = useCallback(
    async (page: number, pageSize: number) => {
      setLoading(true);
      setError('');
      try {
        const params: {
          status?: string[];
          search?: string;
          page: number;
          limit: number;
          dateFrom?: string;
          dateTo?: string;
        } = {
          status: filters.statuses.length ? filters.statuses : undefined,
          search: filters.search || undefined,
          page,
          limit: pageSize,
        };

        if (filters.dateRange) {
          const [start, end] = filters.dateRange;
          if (start) {
            params.dateFrom = start.format('YYYY-MM-DD');
          }
          if (end) {
            params.dateTo = end.format('YYYY-MM-DD');
          }
        }

        const response: ModerationPhotoResponse = await fetchPhotoModerationQueue(params);
        setRecords(response.items);
        setSummary(getSummary(response.items));
        setPagination({
          current: response.meta.currentPage,
          pageSize: response.meta.itemsPerPage,
          total: response.meta.totalItems,
        });
      } catch (err) {
        setError(`Failed to load moderation queue: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [filters.statuses, filters.search, filters.dateRange],
  );

  useEffect(() => {
    loadPhotos(1, pagination.pageSize);
  }, [filters.statuses, filters.search, filters.dateRange, loadPhotos]);

  const handleStatusChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, statuses: values }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (
    range: DateRange,
    _dateStrings: [string, string],
  ) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    setFilters((prev) => ({ ...prev, search: trimmed }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (tablePagination: TablePaginationConfig) => {
    const current = tablePagination.current ?? 1;
    const pageSize = tablePagination.pageSize ?? pagination.pageSize;
    setPagination({ current, pageSize, total: pagination.total });
    loadPhotos(current, pageSize);
  };

  const openDecisionModal = (
    record: ModerationPhotoRecord,
    nextDecision: 'approve' | 'reject',
  ) => {
    setSelectedPhoto(record);
    setDecision(nextDecision);
    setModalVisible(true);
    setAuditLogs([]);
    setAuditLoading(true);
    form.resetFields();
  };

  const handleDecisionSubmit = async () => {
    if (!selectedPhoto) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await moderatePhotoDecision(
        selectedPhoto.id,
        decision,
        values.auditReason,
        values.note,
      );
      setModalVisible(false);
      message.success(decision === 'approve' ? 'Photo approved.' : 'Photo rejected.');
      await loadPhotos(pagination.current, pagination.pageSize);
    } catch (err) {
      if ((err as any)?.errorFields) {
        return;
      }
      message.error(`Failed to apply moderation decision: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchAuditTrail = async () => {
      if (!modalVisible || !selectedPhoto?.user?.uid) {
        setAuditLogs([]);
        setAuditLoading(false);
        return;
      }

      try {
        setAuditLoading(true);
        const response = await fetchAuditLogs({
          action: 'UPDATE_SENSITIVE_DATA',
          targetUid: selectedPhoto.user.uid,
          limit: 20,
        });
        const filtered = response.items.filter((entry) => {
          if (!entry.details) return false;
          const photoId = entry.details.photoId ?? entry.details.photo_id;
          return Number(photoId) === selectedPhoto.photoId;
        });
        setAuditLogs(filtered);
      } catch (err) {
        message.error(`Failed to load audit trail: ${String(err)}`);
        setAuditLogs([]);
      } finally {
        setAuditLoading(false);
      }
    };

    fetchAuditTrail();
  }, [modalVisible, selectedPhoto, message]);

  const columns: ColumnsType<ModerationPhotoRecord> = useMemo(() => {
    return [
      {
        title: 'Photo',
        dataIndex: 'photo',
        key: 'photo',
        render: (photo: ModerationPhotoRecord['photo']) => (
          <Image
            src={photo.publicUrl ?? ''}
            alt={photo.objectPath}
            style={{ width: 160, borderRadius: 8, objectFit: 'cover' }}
            fallback="https://via.placeholder.com/160?text=No+Image"
          />
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (_value, record) => (
          <Space direction="vertical" size={4}>
            {statusTag(record.status)}
            {nsfwTag(record)}
          </Space>
        ),
      },
      {
        title: 'User',
        dataIndex: 'user',
        key: 'user',
        render: (user: ModerationPhotoRecord['user']) => (
          <Space direction="vertical" size={0}>
            <Text strong>{user.name ?? user.uid ?? `UID-${user.id}`}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.email ?? 'Email unavailable'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.regionCode ?? 'Region unknown'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Metadata',
        key: 'meta',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>Path: {record.photo.objectPath}</Text>
            <Text>
              Resolution:{' '}
              {record.photo.width && record.photo.height
                ? `${record.photo.width}×${record.photo.height}`
                : 'Unknown'}
            </Text>
            <Text>Bytes: {record.photo.bytes ?? 'Unknown'}</Text>
            <Text>Uploaded: {formatDate(record.photo.createdAt)}</Text>
          </Space>
        ),
      },
      {
        title: 'Review',
        key: 'review',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>Created: {formatDate(record.createdAt)}</Text>
            <Text>Reviewed: {formatDate(record.reviewedAt)}</Text>
            {record.reviewNotes && (
              <Text type="secondary">Notes: {record.reviewNotes}</Text>
            )}
            {record.labels && record.labels.length > 0 && (
              <Text type="secondary">Labels: {record.labels.join(', ')}</Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_value, record) => (
          <Space>
            <Button type="link" onClick={() => openDecisionModal(record, 'approve')}>
              Approve
            </Button>
            <Button type="link" danger onClick={() => openDecisionModal(record, 'reject')}>
              Reject
            </Button>
          </Space>
        ),
      },
    ];
  }, []);

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Photo Moderation
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} md={4}>
            <Statistic title="Total" value={summary.total} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic title="Pending" value={summary.pending} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic title="Auto-Flagged" value={summary.autoFlagged} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic title="Approved" value={summary.approved} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Statistic title="Rejected" value={summary.rejected} />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap align="center">
          <Select
            mode="multiple"
            allowClear
            style={{ minWidth: 220 }}
            placeholder="Filter by status"
            value={filters.statuses}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <Input
            placeholder="Search by email, name, or UID"
            style={{ width: 260 }}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />

          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>

          <RangePicker
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            allowClear
          />

          <Button onClick={() => loadPhotos(pagination.current, pagination.pageSize)}>
            Refresh
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={decision === 'approve' ? 'Approve Photo' : 'Reject Photo'}
        open={modalVisible}
        okText={decision === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{ loading: submitting, danger: decision === 'reject' }}
        onOk={handleDecisionSubmit}
        onCancel={() => {
          if (!submitting) {
            setModalVisible(false);
          }
        }}
        destroyOnClose
      >
        {selectedPhoto && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Image
              src={selectedPhoto.photo.publicUrl ?? ''}
              alt={selectedPhoto.photo.objectPath}
              style={{ width: '100%', borderRadius: 8 }}
              fallback="https://via.placeholder.com/320?text=No+Image"
            />
            <Form form={form} layout="vertical">
              <Form.Item
                name="auditReason"
                label="Audit Reason"
                rules={[{ required: true, message: 'Please provide an audit reason.' }]}
              >
                <Input.TextArea rows={3} maxLength={255} placeholder="Explain your moderation decision." />
              </Form.Item>
              <Form.Item name="note" label="Reviewer Notes">
                <Input.TextArea rows={3} maxLength={255} placeholder="Optional notes (visible to admin team)." />
              </Form.Item>
            </Form>
            <Card size="small" title="Audit Trail" bordered={false}>
              {auditLoading ? (
                <Text type="secondary">Loading audit history…</Text>
              ) : auditLogs.length > 0 ? (
                <List
                  size="small"
                  dataSource={auditLogs}
                  renderItem={(item) => {
                    const details = (item.details ?? {}) as Record<string, unknown>;
                    const notesText = details.notes ? renderDetailValue(details.notes) : '';
                    const labelsText = Array.isArray(details.labels)
                      ? renderDetailValue(details.labels)
                      : '';

                    return (
                      <List.Item>
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text strong>{formatDate(item.timestamp)}</Text>
                          <Text type="secondary">Reviewer: {item.accessorId}</Text>
                          {notesText && <Text type="secondary">Notes: {notesText}</Text>}
                          {labelsText && <Text type="secondary">Labels: {labelsText}</Text>}
                          <Text type="secondary">Action: {item.action}</Text>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Text type="secondary">No audit entries yet.</Text>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PhotoModeration;
