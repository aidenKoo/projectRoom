
import axios from 'axios';
import { auth } from '../firebase.ts';

const api = axios.create({
  baseURL: 'http://localhost:3001/v1',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ProfileSummary = {
  uid: string;
  email: string;
  name: string | null;
  regionCode: string | null;
  age: number | null;
  jobGroup: string | null;
  education: string | null;
  hobbies?: string[] | null;
  mbti?: string[] | null;
};

export type MatchQueueRecommendation = {
  id: string;
  userId: string;
  targetUserId: string;
  score: number;
  scoreBreakdown: Record<string, unknown> | null;
  sharedBits: string[] | null;
  reason: string | null;
  status: 'queued' | 'shown' | 'skipped';
  createdAt: string;
  shownAt: string | null;
  waitMinutes: number;
  isShown: boolean;
  isSkipped: boolean;
  baseProfile: ProfileSummary | null;
  targetProfile: ProfileSummary | null;
};

export type MatchQueueStats = {
  total: number;
  queued: number;
  shown: number;
  skipped: number;
  stale: number;
  avgScore: number;
  p95WaitMinutes: number;
};

export type MatchQueueResponse = {
  owner: ProfileSummary | null;
  stats: MatchQueueStats;
  recommendations: MatchQueueRecommendation[];
  retrievedAt: string;
  filter: {
    userId: string | null;
    limit: number;
  };
};

export async function fetchMatchQueue(params: { userId?: string }) {
  const response = await api.get<MatchQueueResponse>('/admin/match/queue', {
    params,
  });
  return response.data;
}

export type ModerationUserSummary = {
  id: number;
  uid?: string;
  email?: string;
  name?: string | null;
  regionCode?: string | null;
};

export type ModerationPhotoRecord = {
  id: number;
  photoId: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_flagged';
  nsfw: boolean;
  nsfwScore?: number | null;
  labels: ModerationLabel[];
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  user: ModerationUserSummary;
  profile?: {
    jobGroup?: string | null;
    education?: string | null;
  } | null;
  photo: {
    id?: number;
    objectPath: string;
    publicUrl?: string;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    isPrimary?: boolean;
    createdAt?: string;
  };
};

export type ModerationLabel = {
  provider: string;
  label: string;
  score?: number | null;
};

export type PaginationMeta = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type ModerationPhotoResponse = {
  items: ModerationPhotoRecord[];
  meta: PaginationMeta;
};

export async function fetchPhotoModerationQueue(params?: {
  status?: string[];
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const query: Record<string, string | number> = {};
  if (params?.status && params.status.length > 0) {
    query.status = params.status.join(',');
  }
  if (params?.search) {
    query.search = params.search;
  }
  if (params?.page) {
    query.page = params.page;
  }
  if (params?.limit) {
    query.limit = params.limit;
  }
  if (params?.dateFrom) {
    query.dateFrom = params.dateFrom;
  }
  if (params?.dateTo) {
    query.dateTo = params.dateTo;
  }

  const response = await api.get<ModerationPhotoResponse>('/admin/moderation/photos', {
    params: query,
  });
  return response.data;
}

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  accessorId: string;
  targetUserId: string;
  action: string;
  details?: Record<string, unknown> | null;
};

export type AuditLogResponse = {
  items: AuditLogEntry[];
  meta: PaginationMeta;
};

export async function fetchAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  targetUid?: string;
  actorUid?: string;
}) {
  const query: Record<string, string | number> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.action) query.action = params.action;
  if (params?.targetUid) query.targetUid = params.targetUid;
  if (params?.actorUid) query.actorUid = params.actorUid;

  const response = await api.get<AuditLogResponse>('/audit-logs', {
    params: query,
  });
  return response.data;
}

export async function moderatePhotoDecision(
  photoMetaId: number,
  decision: 'approve' | 'reject',
  auditReason: string,
  note?: string,
) {
  const response = await api.post<ModerationPhotoRecord>(
    `/admin/moderation/photos/${photoMetaId}/decision`,
    {
      decision,
      note,
    },
    {
      headers: {
        'X-Audit-Reason': auditReason,
      },
    },
  );

  return response.data;
}

export default api;

// =====================
// A/B Experiments (Admin)
// =====================

export type AbAssignment = {
  id: number;
  userId: number;
  experiment: string;
  variant: string;
  assignedAt: string;
};

export type AbAssignmentList = {
  items: AbAssignment[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAbAssignments(params?: {
  experiment?: string;
  variant?: string;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, string | number> = {};
  if (params?.experiment) query.experiment = params.experiment;
  if (params?.variant) query.variant = params.variant;
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  const response = await api.get<AbAssignmentList>('/admin/experiments/assignments', { params: query });
  return response.data;
}

export async function fetchAbVariantCounts(experiment: string) {
  const response = await api.get<{ experiment: string; counts: Record<string, number> }>(
    '/admin/experiments/variants',
    { params: { experiment } },
  );
  return response.data;
}

// Match config experiments (available keys and config preview)
export async function fetchAvailableExperiments() {
  const response = await api.get<{ available: string[]; configs: Record<string, any> }>(
    '/admin/match/config/experiments'
  );
  return response.data;
}

export async function fetchMatchExperimentConfig(key: string) {
  const response = await api.get<{ experimentKey: string; config: Record<string, any>; isDefault: boolean }>(
    `/admin/match/config/experiments/${encodeURIComponent(key)}`
  );
  return response.data;
}

export async function fetchAbStats(params: { experiment: string; dateFrom?: string; dateTo?: string }) {
  const response = await api.get<{ experiment: string; variants: Array<{ variant: string; exposures: number; conversions: number; conversionRate: number }>; totals: { exposures: number; conversions: number; conversionRate: number } }>(
    '/admin/experiments/stats',
    { params }
  );
  return response.data;
}

export async function recordExperimentEvent(body: { experiment: string; event: 'exposure' | 'conversion'; variant?: string; properties?: Record<string, any> }) {
  const response = await api.post<{ ok: true; id: number }>(
    '/experiments/events',
    body
  );
  return response.data;
}

export async function fetchExperimentRolloutConfig(experiment: string) {
  const response = await api.get<{ experiment: string; config: any }>(
    `/admin/experiments/config/${encodeURIComponent(experiment)}`
  );
  return response.data;
}

export async function updateExperimentRolloutConfig(experiment: string, payload: any) {
  const response = await api.put<{ experiment: string; config: any }>(
    `/admin/experiments/config/${encodeURIComponent(experiment)}`,
    payload
  );
  return response.data;
}

export async function forceAbAssignment(body: { userId: number; experiment: string; variant: string }, auditReason: string) {
  const response = await api.post<AbAssignment>('/admin/experiments/assignments', body, {
    headers: { 'X-Audit-Reason': auditReason },
  });
  return response.data;
}

export async function deleteAbAssignment(id: number, auditReason: string) {
  const response = await api.delete<{ ok: true }>(`/admin/experiments/assignments/${id}`, {
    headers: { 'X-Audit-Reason': auditReason },
  });
  return response.data;
}
