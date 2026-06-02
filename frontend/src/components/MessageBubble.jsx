import ReactMarkdown from 'react-markdown'
import SourcesPanel from './SourcesPanel'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isThinking = message.content === '...' && !isUser

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold
        ${isUser ? 'bg-violet-600 text-white' : 'bg-gray-800 border border-gray-700 text-base'}`}>
        {isUser ? 'U' : '🧠'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
          }`}>
          {isThinking ? (
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources?.length > 0 && (
          <SourcesPanel sources={message.sources} />
        )}

        <span className="text-xs text-gray-600 px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  )
}
