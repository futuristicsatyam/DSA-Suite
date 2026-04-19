import { api } from './utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  constraints: string | null;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  orderIndex: number | null;
  topic: { title: string; slug: string; subject: { name: string; categoryType: string } };
  testCases?: TestCase[];
  _count: { submissions: number; testCases: number };
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden: boolean;
  orderIndex: number | null;
}

export interface Submission {
  id: string;
  verdict: Verdict;
  runtime: string | null;
  memory: number | null;
  testCasesPassed: number;
  testCasesTotal: number;
  errorOutput: string | null;
  language: string;
  code?: string;
  createdAt: string;
}

export type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'PENDING';

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getProblems(params?: {
  topicId?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.topicId) searchParams.set('topicId', params.topicId);
  if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const res = await api.get(`/problems${query ? `?${query}` : ''}`);
  return res.data as { data: Problem[]; total: number; page: number; totalPages: number };
}

export async function getProblemBySlug(slug: string) {
  const res = await api.get(`/problems/${slug}`);
  return res.data as Problem;
}

export async function getProblemsForTopic(topicId: string) {
  const res = await api.get(`/problems/topic/${topicId}`);
  return res.data as {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
    orderIndex: number | null;
    _count: { submissions: number };
  }[];
}

export async function submitCode(data: { problemId: string; language: string; code: string }) {
  const res = await api.post('/problems/submit', data);
  return res.data as Submission;
}

export async function getMySubmissions(slug: string) {
  const res = await api.get(`/problems/${slug}/submissions`);
  return res.data as Submission[];
}

export async function getSubmissionById(id: string) {
  const res = await api.get(`/problems/submissions/${id}`);
  return res.data as Submission;
}

export async function getSolvedProblemIds() {
  const res = await api.get('/problems/solved');
  return res.data as string[];
}
