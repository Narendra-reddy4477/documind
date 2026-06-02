import { useEffect, useState } from 'react'
import { getHealth } from '../api/client'

export default function OllamaStatus() {
  const [status,  setStatus]  = useState(null)
  const [loading, setLoading] = useState(true)

  const check = async () => {
    try {
      const { data } = await getHealth()
      setStatus(data)
    } catch {
      setStatus({ connected: false, model_loaded: false, error: 'Cannot reach backend' })
    } finally { setLoading(false) }
  }

  useEffect(() => { check(); const t = setInterval(check, 30000); return () => clearInterval(t) }, [])

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
      Checking Ollama...
    </div>
  )

  const ok = status?.connected && status?.model_loaded

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-green-400 animate-pulse' : status?.connected ? 'bg-yellow-400' : 'bg-red-400'}`} />
        <span className="text-xs font-medium">
          {ok ? `${status.model_name} ready` : status?.connected ? 'Model not loaded' : 'Ollama offline'}
        </span>
      </div>
      {status?.error && (
        <p className="text-xs text-red-400 leading-tight pl-4">{status.error}</p>
      )}
    </div>
  )
}
