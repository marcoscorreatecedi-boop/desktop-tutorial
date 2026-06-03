const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Erro na requisição')
  }
  return res.json()
}

// Projects
export const api = {
  projects: {
    list: () => request<import('../types').Project[]>('/projects'),
    get: (id: number) => request<import('../types').Project>(`/projects/${id}`),
    create: (data: { name: string; address?: string; start_date?: string }) =>
      request<import('../types').Project>('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<import('../types').Project>) =>
      request<import('../types').Project>(`/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  },

  uploads: {
    list: (projectId: number) =>
      request<import('../types').Upload[]>(`/uploads?project_id=${projectId}`),
    upload: (projectId: number, file: File, notes: string) => {
      const form = new FormData()
      form.append('project_id', String(projectId))
      form.append('notes', notes)
      form.append('file', file)
      return request<import('../types').Upload>('/uploads', { method: 'POST', body: form })
    },
    analyze: (uploadId: number) =>
      request<import('../types').Upload>(`/uploads/${uploadId}/analyze`, { method: 'POST' }),
    delete: (uploadId: number) =>
      request<{ ok: boolean }>(`/uploads/${uploadId}`, { method: 'DELETE' }),
    fileUrl: (uploadId: number) => `${BASE}/uploads/${uploadId}/file`,
  },

  stages: {
    list: (projectId: number) =>
      request<import('../types').Stage[]>(`/stages?project_id=${projectId}`),
    criticalPath: (projectId: number) =>
      request<import('../types').Stage[]>(`/stages/critical-path?project_id=${projectId}`),
    update: (stageId: number, data: Partial<import('../types').Stage>) =>
      request<import('../types').Stage>(`/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    dashboard: (projectId: number) =>
      request<import('../types').DashboardStats>(`/stages/dashboard/${projectId}`),
  },
}
