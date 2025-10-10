
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
  labels: string[];
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
