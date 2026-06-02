import { useState } from 'react'

export default function SourcesPanel({ sources }) {
  const [expanded, setExpanded] = useState(null)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        📎 {sources.length} source{sources.length > 1 ? 's' : ''} referenced
      </p>
      <div className="space-y-1.5">
        {sources.map((src, i) => (
          <div key={src.chunk_id || i}
            className="bg-gray-800/60 border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded">
                  Chunk {i + 1}
                </span>
                {src.page && (
                  <span className="text-xs text-gray-500">Page {src.page}</span>
                )}
              </div>
              <span className="text-gray-500 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </button>
            {expanded === i && (
              <div className="px-3 pb-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed mt-2 font-mono">
                  {src.content}
                  {src.content?.length >= 300 && '...'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
