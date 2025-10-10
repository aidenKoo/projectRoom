import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  fetchPhotoModerationQueue,
  moderatePhotoDecision,
  ModerationPhotoRecord,
} from '../services/api';

const { Title, Text } = Typography;

const STATUS_OPTIONS: { value: ModerationPhotoRecord['status']; label: string; color: string }[] = [
  { value: 'pending', label: '寃???湲?, color: 'blue' },
  { value: 'auto_flagged', label: '?먮룞 ?뚮옒洹?, color: 'orange' },
  { value: 'approved', label: '?뱀씤??, color: 'green' },
  { value: 'rejected', label: '嫄곗젅??, color: 'red' },
];

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
    return <Tag color="green">?뺤긽</Tag>;
  }
  const confidence = record.nsfwScore != null ? `쨌 ${(record.nsfwScore * 100).toFixed(0)}%` : '';
  return <Tag color="red">NSFW {confidence}</Tag>;
};

const MAX_PREVIEW_WIDTH = 160;

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const PhotoModeration: React.FC = () => {
  const [photos, setPhotos] = useState<ModerationPhotoRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending', 'auto_flagged']);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ModerationPhotoRecord | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ auditReason: string; note?: string }>();

  const loadPhotos = async (statuses: string[]) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPhotoModerationQueue(statuses);
      setPhotos(data);
    } catch (err) {
      setError(`?湲곗뿴??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos(selectedStatuses);
  }, [selectedStatuses]);

  const summary = useMemo(() => {
    const counts = photos.reduce<Record<string, number>>((acc, photo) => {
      acc[photo.status] = (acc[photo.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: photos.length,
      pending: counts.pending ?? 0,
      autoFlagged: counts.auto_flagged ?? 0,
      approved: counts.approved ?? 0,
      rejected: counts.rejected ?? 0,
    };
  }, [photos]);

  const openDecisionModal = (record: ModerationPhotoRecord, nextDecision: 'approve' | 'reject') => {
    setSelectedPhoto(record);
    setDecision(nextDecision);
    setModalVisible(true);
    form.resetFields();
  };

  const handleDecisionSubmit = async () => {
    if (!selectedPhoto) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const updated = await moderatePhotoDecision(
        selectedPhoto.id,
        decision,
        values.auditReason,
        values.note,
      );
      setPhotos((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)).filter((item) => {
          if (selectedStatuses.length === 0) return true;
          return selectedStatuses.includes(item.status);
        }),
      );
      setModalVisible(false);
      message.success(decision === 'approve' ? '?ъ쭊???뱀씤?섏뿀?듬땲??' : '?ъ쭊??嫄곗젅?섏뿀?듬땲??');
    } catch (err) {
      if ((err as any)?.errorFields) {
        return;
      }
      message.error(`寃곗젙 ?곸슜???ㅽ뙣?덉뒿?덈떎: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<ModerationPhotoRecord> = useMemo(
    () => [
      {
        title: '?ъ쭊',
        dataIndex: 'photo',
        key: 'photo',
        render: (photo: ModerationPhotoRecord['photo']) => (
          <Image
            src={photo.publicUrl ?? ''}
            alt={photo.objectPath}
            style={{ width: MAX_PREVIEW_WIDTH, borderRadius: 8 }}
            fallback="https://via.placeholder.com/160?text=No+Image"
          />
        ),
      },
      {
        title: '?곹깭',
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
        title: '?ъ슜??,
        dataIndex: 'user',
        key: 'user',
        render: (user: ModerationPhotoRecord['user']) => (
          <Space direction="vertical" size={0}>
            <Text strong>{user.name ?? user.uid ?? `UID-${user.id}`}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.email ?? '-'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.regionCode ?? '吏??誘몄엯??}
            </Text>
          </Space>
        ),
      },
      {
        title: '硫뷀??뺣낫',
        key: 'meta',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>寃쎈줈: {record.photo.objectPath}</Text>
            <Text>
              ?댁긽??{' '}
              {record.photo.width && record.photo.height
                ? `${record.photo.width}x${record.photo.height}`
                : '誘몄긽'}
            </Text>
            <Text>?⑸웾: {record.photo.bytes != null ? `${((record.photo.bytes ?? 0) / 1024).toFixed(1)} KB` : '誘몄긽'}</Text>
            <Text>????ъ쭊: {record.photo.isPrimary ? '?? : '?꾨땲??}</Text>
          </Space>
        ),
      },
      {
        title: '?뚮옒洹?,
        dataIndex: 'labels',
        key: 'labels',
        render: (labels: string[]) =>
          labels && labels.length > 0 ? (
            <Space wrap>
              {labels.map((label) => (
                <Tag key={label} color="volcano">
                  {label}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: '寃??硫붾え',
        dataIndex: 'reviewNotes',
        key: 'reviewNotes',
        render: (value: string | null | undefined) =>
          value ? <Text>{value}</Text> : <Text type="secondary">-</Text>,
      },
      {
        title: '理쒓렐 ?낅뜲?댄듃',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>{formatDate(record.reviewedAt)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.reviewedBy ?? ''}
            </Text>
          </Space>
        ),
      },
      {
        title: '議곗튂',
        key: 'action',
        render: (_value, record) => (
          <Space>
            <Button
              type="primary"
              ghost
              onClick={() => openDecisionModal(record, 'approve')}
              disabled={record.status === 'approved'}
            >
              ?뱀씤
            </Button>
            <Button
              danger
              onClick={() => openDecisionModal(record, 'reject')}
              disabled={record.status === 'rejected'}
            >
              嫄곗젅
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <Title level={2} style={{ marginBottom: 12 }}>
        ?ъ쭊 紐⑤뜑?덉씠??      </Title>
      <Text type="secondary">
        Firebase Storage ?낅줈????Cloud Function?먯꽌 ?꾨떖???ъ쭊 硫뷀??곗씠?곕? 湲곕컲?쇰줈 NSFW ?뚮옒洹몃? 寃?좏븯?몄슂.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="?湲곗뿴" value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="寃???湲? value={summary.pending} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="?먮룞 ?뚮옒洹? value={summary.autoFlagged} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="?뱀씤?? value={summary.approved} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Space style={{ marginBottom: 16 }} size="large" wrap>
          <div>
            <Text strong>?곹깭 ?꾪꽣</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="?꾪꽣留곹븷 ?곹깭瑜??좏깮?섏꽭??
              style={{ minWidth: 240, marginLeft: 12 }}
              value={selectedStatuses}
              onChange={(value) => setSelectedStatuses(value)}
              options={STATUS_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
            />
          </div>
          <Button onClick={() => loadPhotos(selectedStatuses)} icon={loading ? undefined : undefined}>
            ?덈줈怨좎묠
          </Button>
        </Space>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => loadPhotos(selectedStatuses)}>
                ?ㅼ떆 ?쒕룄
              </Button>
            }
          />
        )}

        <Table<ModerationPhotoRecord>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={photos}
          loading={loading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: loading ? <Spin /> : '寃?좏븷 ?ъ쭊???놁뒿?덈떎.',
          }}
        />
      </Card>

      <Modal
        title={decision === 'approve' ? '?ъ쭊 ?뱀씤' : '?ъ쭊 嫄곗젅'}
        open={modalVisible}
        onOk={handleDecisionSubmit}
        okText={decision === 'approve' ? '?뱀씤' : '嫄곗젅'}
        okButtonProps={{ loading: submitting, type: decision === 'approve' ? 'primary' : 'default', danger: decision === 'reject' }}
        onCancel={() => {
          if (!submitting) {
            setModalVisible(false);
          }
        }}
        cancelButtonProps={{ disabled: submitting }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            {selectedPhoto?.user.name ?? selectedPhoto?.user.uid ?? '?ъ슜??}???ъ쭊?????' '}
            <Text strong>{decision === 'approve' ? '?뱀씤' : '嫄곗젅'}</Text> 泥섎━瑜??곸슜?⑸땲??
          </Text>
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item
              label="媛먯궗 ?ъ쑀 (X-Audit-Reason)"
              name="auditReason"
              rules={[{ required: true, message: '媛먯궗 ?ъ쑀瑜??낅젰?댁＜?몄슂.' }]}
            >
              <Input.TextArea rows={3} placeholder="?? ?ъ슜???좉퀬 ?뺤씤 / ?꾨줈??媛?대뱶 ?꾨컲" />
            </Form.Item>
            <Form.Item
              label="硫붾え"
              name="note"
              rules={[{ max: 255, message: '255???대궡濡??낅젰?댁＜?몄슂.' }]}
            >
              <Input.TextArea rows={3} placeholder="寃??硫붾え (?좏깮)" />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
};

export default PhotoModeration;
