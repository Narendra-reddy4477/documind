import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments } from '../api/client'
import UploadZone from '../components/UploadZone'

export default function Home() {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  const fetchDocs = async () => {
    try {
      const { data } = await getDocuments()
      setDocs(data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchDocs()
    const handler = () => fetchDocs()
    window.addEventListener('docs:refresh', handler)
    return () => window.removeEventListener('docs:refresh', handler)
  }, [])

  const formatSize = (bytes) => {
    if (bytes < 1024)      return `${bytes} B`
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/(1024*1024)).toFixed(1)} MB`
  }

  const fileIcon = (type) => ({ pdf: '📄', docx: '📝', txt: '📃' }[type] || '📁')

  return (
    <div className="flex-1 p-8 animate-fade-in max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-4">🧠</div>
        <h1 className="text-4xl font-bold mb-2">
          DocuMind
        </h1>
        <p className="text-gray-400 text-lg">
          Upload any document and chat with it using local AI.<br/>
          <span className="text-sm text-gray-600">Powered by Ollama — everything stays on your machine.</span>
        </p>
      </div>

      {/* Upload */}
      <div className="mb-10">
        <UploadZone />
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: '📤', step: '1', title: 'Upload',  desc: 'PDF, DOCX, or TXT up to 20MB' },
          { icon: '🔍', step: '2', title: 'Index',   desc: 'AI reads and embeds your doc locally' },
          { icon: '💬', step: '3', title: 'Chat',    desc: 'Ask anything — get cited answers' },
        ].map(({ icon, step, title, desc }) => (
          <div key={step} className="card p-4 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs text-violet-400 font-medium mb-1">Step {step}</p>
            <p className="font-semibold text-sm mb-1">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Existing docs */}
      {!loading && docs.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-400 mb-3">Or continue with an existing document:</p>
          <div className="space-y-2">
            {docs.slice(0, 5).map(doc => (
              <button key={doc.id} onClick={() => navigate(`/chat/${doc.id}`)}
                className="w-full card px-4 py-3 flex items-start gap-3 hover:border-violet-500/40 transition-all text-left group">
                <span className="text-xl">{fileIcon(doc.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-violet-400 transition-colors truncate">
                    {doc.filename}
                  </p>
                  {doc.summary && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.summary}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {formatSize(doc.file_size)} · {doc.chunk_count} chunks · {doc.file_type.toUpperCase()}
                  </p>
                </div>
                <span className="text-gray-600 group-hover:text-violet-400 transition-colors text-lg">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
