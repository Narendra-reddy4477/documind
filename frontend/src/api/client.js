import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Documents ─────────────────────────────────────────────
export const getDocuments    = ()      => api.get('/documents/')
export const getDocument     = (id)    => api.get(`/documents/${id}`)
export const deleteDocument  = (id)    => api.delete(`/documents/${id}`)

export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(
      Math.round((e.loaded * 100) / e.total)
    ),
  })
}

// ── Health ────────────────────────────────────────────────
export const getHealth = () => api.get('/health/')

// ── Streaming chat (SSE) ──────────────────────────────────
export const streamChat = async (payload, onToken, onSources, onDone) => {
  const res = await fetch('/api/chat/stream', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Chat request failed')
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() // keep incomplete chunk

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const { type, data } = JSON.parse(line.slice(6))
        if (type === 'sources') onSources && onSources(data)
        if (type === 'token')   onToken   && onToken(data)
        if (type === 'done')    onDone    && onDone()
      } catch { /* skip malformed */ }
    }
  }
}

export default api
