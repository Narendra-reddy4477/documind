import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getDocuments, deleteDocument } from '../api/client'
import toast from 'react-hot-toast'
import OllamaStatus from './OllamaStatus'

export default function Layout() {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  const fetchDocs = async () => {
    try {
      const { data } = await getDocuments()
      setDocs(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [])

  // Expose refresh to child pages via a custom event
  useEffect(() => {
    const handler = () => fetchDocs()
    window.addEventListener('docs:refresh', handler)
    return () => window.removeEventListener('docs:refresh', handler)
  }, [])

  const handleDelete = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      await deleteDocument(id)
      toast.success('Document deleted')
      setDocs(prev => prev.filter(d => d.id !== id))
      navigate('/')
    } catch { toast.error('Delete failed') }
  }

  const fileIcon = (type) => ({ pdf: '📄', docx: '📝', txt: '📃' }[type] || '📁')

  const formatSize = (bytes) => {
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/(1024*1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl flex items-center justify-center text-lg">
              🧠
            </div>
            <div>
              <p className="font-bold text-base leading-tight">DocuMind</p>
              <p className="text-xs text-gray-500">AI Document Intelligence</p>
            </div>
          </NavLink>
        </div>

        {/* Ollama status */}
        <div className="px-4 py-3 border-b border-gray-800">
          <OllamaStatus />
        </div>

        {/* Upload CTA */}
        <div className="p-4 border-b border-gray-800">
          <NavLink to="/" className="btn-primary w-full flex items-center justify-center gap-2 text-center">
            <span>+</span> Upload Document
          </NavLink>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider px-2 mb-2">
            Your Documents ({docs.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8 px-4">
              No documents yet. Upload one to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {docs.map(doc => (
                <NavLink key={doc.id} to={`/chat/${doc.id}`}
                  className={({ isActive }) =>
                    `flex items-start gap-2.5 px-3 py-2.5 rounded-lg group transition-all ${
                      isActive ? 'bg-violet-600/10 border border-violet-500/20' : 'hover:bg-gray-800'
                    }`
                  }>
                  <span className="text-lg flex-shrink-0 mt-0.5">{fileIcon(doc.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-200">{doc.filename}</p>
                    <p className="text-xs text-gray-500">{formatSize(doc.file_size)} · {doc.chunk_count} chunks</p>
                  </div>
                  <button onClick={(e) => handleDelete(e, doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs mt-0.5 flex-shrink-0">
                    ✕
                  </button>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="ml-72 flex-1 min-h-screen flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
