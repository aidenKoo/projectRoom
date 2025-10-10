
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

export async function fetchPhotoModerationQueue(status?: string[]) {
  const params: Record<string, string> = {};
  if (status && status.length > 0) {
    params.status = status.join(',');
  }
  const response = await api.get<ModerationPhotoRecord[]>('/admin/moderation/photos', {
    params,
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
