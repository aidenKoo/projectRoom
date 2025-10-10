
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

export default api;
