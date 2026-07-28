const TOKEN_KEY = 'dtech_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers, credentials: 'include' })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || JSON.stringify(data)
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export type User = {
  id: string
  email: string | null
  display_name: string | null
  role: string
  avatar_url?: string | null
}

export type Project = {
  id: string
  title: string
  homepage_preview: string | null
  status: string
  priority: number
  problem: string | null
  solution: string | null
  costs: Record<string, unknown> | null
  scores: Record<string, unknown> | null
  community_vote_count: number
  parent_project_id?: string | null
  branch_label?: string | null
  problem_ids: string[]
  target_price_usd: number | null
  user_has_voted: boolean
  source?: Record<string, unknown> | null
  why_widespread?: string | null
  target_user?: string | null
  feasibility?: Record<string, unknown> | null
  market?: Record<string, unknown> | null
  software_plan?: Record<string, unknown> | null
  solved?: unknown[] | null
  unsolved?: unknown[] | null
  next_actions?: unknown[] | null
  notes?: string | null
  suggestion_count?: number
  cart_grand_total_usd?: number | null
}

export type Problem = {
  id: string
  title: string
  status: string
  domain: string | null
  summary: string
  scores: Record<string, unknown> | null
  community_vote_count: number
  linked_project_ids: string[]
  need: number | null
  opportunity: number | null
  user_has_voted: boolean
  first_seen?: string | null
  last_new_signal_at?: string | null
  rollup?: Record<string, unknown> | null
  notes?: string | null
  observations?: { id: string; paraphrase: string; observed_at: string | null; severity: number | null }[]
  linked_projects?: Project[]
}

export type Suggestion = {
  id: string
  project_id: string
  body: string
  tag: string | null
  status: string
  vote_count: number
  created_at: string
  author_display_name: string | null
  user_has_voted: boolean
}

export type HomeStats = {
  project_count: number
  problem_count: number
  total_project_votes: number
  total_suggestions: number
  latest_research_at: string | null
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  home: () => request<HomeStats>('/api/home'),
  me: () => request<User | null>('/api/auth/me'),
  magicLink: (email: string, redirect_path?: string) =>
    request<{ message: string; dev_token?: string; dev_verify_url?: string }>('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, redirect_path }),
    }),
  verify: (token: string) =>
    request<{ access_token: string; user: User; redirect_path?: string }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  projects: (sort = 'priority') => request<Project[]>(`/api/projects?sort=${sort}`),
  project: (id: string) => request<Project>(`/api/projects/${id}`),
  problems: (sort = 'need') => request<Problem[]>(`/api/problems?sort=${sort}`),
  problem: (id: string) => request<Problem>(`/api/problems/${id}`),
  suggestions: (projectId: string) => request<Suggestion[]>(`/api/projects/${projectId}/suggestions`),
  vote: (target_type: 'project' | 'problem' | 'suggestion', target_id: string) =>
    request<{ voted: boolean; vote_count: number }>('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ target_type, target_id }),
    }),
  createSuggestion: (project_id: string, body: string, tag?: string | null) =>
    request<Suggestion>('/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({ project_id, body, tag: tag || null }),
    }),
  report: (suggestion_id: string, reason: string) =>
    request<{ ok: boolean }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ suggestion_id, reason }),
    }),
  adminSuggestions: (status?: string) =>
    request<Suggestion[]>(`/api/admin/suggestions${status ? `?status=${status}` : ''}`),
  adminPatchSuggestion: (id: string, status: string) =>
    request<Suggestion>(`/api/admin/suggestions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
