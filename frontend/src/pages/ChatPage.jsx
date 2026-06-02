import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument } from '../api/client'
import { streamChat } from '../api/client'
import MessageBubble from '../components/MessageBubble'
import toast from 'react-hot-toast'

const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const SUGGESTED = [
  'What is this document about?',
  'Summarize the key points',
  'What are the main conclusions?',
  'List the most important findings',
]

export default function ChatPage() {
  const { docId }                     = useParams()
  const navigate                      = useNavigate()
  const [doc,       setDoc]           = useState(null)
  const [messages,  setMessages]      = useState([])
  const [input,     setInput]         = useState('')
  const [streaming, setStreaming]     = useState(false)
  const bottomRef                     = useRef(null)
  const inputRef                      = useRef(null)

  useEffect(() => {
    getDocument(docId)
      .then(r => setDoc(r.data))
      .catch(() => { toast.error('Document not found'); navigate('/') })
  }, [docId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question) => {
    const text = (question || input).trim()
    if (!text || streaming) return
    setInput('')

    const userMsg = { role: 'user', content: text, timestamp: fmt() }
    const thinkMsg = { role: 'assistant', content: '...', timestamp: fmt(), id: 'thinking' }
    setMessages(prev => [...prev, userMsg, thinkMsg])
    setStreaming(true)

    try {
      let fullAnswer = ''
      let sources    = []

      // Build history (exclude thinking placeholder)
      const history = messages
        .filter(m => m.id !== 'thinking')
        .map(m => ({ role: m.role, content: m.content }))

      await streamChat(
        { document_id: docId, question: text, history },
        (token) => {
          fullAnswer += token
          setMessages(prev => prev.map(m =>
            m.id === 'thinking'
              ? { ...m, content: fullAnswer }
              : m
          ))
        },
        (srcs) => { sources = srcs },
        () => {
          // Done — finalize message with sources
          setMessages(prev => prev.map(m =>
            m.id === 'thinking'
              ? { role: 'assistant', content: fullAnswer, sources, timestamp: fmt() }
              : m
          ))
          setStreaming(false)
        }
      )
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'))
      toast.error(err.message || 'Something went wrong')
      setStreaming(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const fileIcon = (type) => ({ pdf: '📄', docx: '📝', txt: '📃' }[type] || '📁')

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
        <button onClick={() => navigate('/')} className="btn-ghost px-2">←</button>
        {doc && (
          <>
            <span className="text-xl">{fileIcon(doc.file_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{doc.filename}</p>
              <p className="text-xs text-gray-500">{doc.chunk_count} chunks indexed · Ask anything about this document</p>
            </div>
          </>
        )}
        {streaming && (
          <div className="flex items-center gap-2 text-xs text-violet-400">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            AI thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Document summary card */}
        {doc?.summary && messages.length === 0 && (
          <div className="card p-5 border-violet-500/20 bg-violet-500/5 animate-fade-in">
            <p className="text-xs font-medium text-violet-400 mb-2 uppercase tracking-wider">📋 Document Summary</p>
            <p className="text-sm text-gray-300 leading-relaxed">{doc.summary}</p>
          </div>
        )}

        {/* Suggested questions */}
        {messages.length === 0 && (
          <div className="animate-fade-in">
            <p className="text-xs text-gray-500 mb-3 font-medium">Suggested questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="card px-4 py-3 text-sm text-left text-gray-400 hover:text-gray-200 hover:border-violet-500/40 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-6 py-4 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={streaming}
              rows={1}
              placeholder="Ask anything about this document..."
              className="input resize-none pr-12 py-3 min-h-[48px] max-h-32"
              style={{ height: 'auto' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />
          </div>
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="btn-primary h-12 w-12 flex items-center justify-center rounded-xl flex-shrink-0 text-lg">
            {streaming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '↑'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Enter to send · Shift+Enter for new line · Answers grounded in your document
        </p>
      </div>
    </div>
  )
}
