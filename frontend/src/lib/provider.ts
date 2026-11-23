import type { Feed, Health, JournalEntry, Token, Workspace } from './types'

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
export class ApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 45_000)
  signal?.addEventListener('abort', () => controller.abort(), { once: true })
  try {
    const response = await fetch(`${apiBase}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new ApiError(`API returned ${response.status}`, response.status)
    return await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(error instanceof Error && error.name === 'AbortError' ? 'Request timed out' : 'API unavailable')
  } finally { window.clearTimeout(timer) }
}

export interface HawkProvider {
  health(signal?: AbortSignal): Promise<Health>
  tokens(workspace: Workspace, signal?: AbortSignal): Promise<Token[]>
  journal(signal?: AbortSignal): Promise<JournalEntry[]>
}

export const apiProvider: HawkProvider = {
  health: signal => request<Health>('/api/health', signal),
  async tokens(workspace, signal) {
    const endpoint: Record<Workspace, string> = {
      overview: '/api/hawk?limit=40', radar: '/api/hawk?limit=50', prime: '/api/prime?limit=25',
      intelligence: '/api/hawk?limit=50', strategies: '/api/hawk?limit=50', memory: '/api/hawk?limit=50', command: '/api/hawk?limit=50',
    }
    const result = await request<Feed<Token> | Token[]>(endpoint[workspace], signal)
    return Array.isArray(result) ? result : result.results ?? []
  },
  async journal(signal) {
    const result = await request<Feed<JournalEntry> | JournalEntry[]>('/api/journal?limit=200', signal)
    return Array.isArray(result) ? result : result.results ?? []
  },
}
