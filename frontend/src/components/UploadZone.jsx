import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocument } from '../api/client'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ACCEPTED = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }

export default function UploadZone() {
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [stage,      setStage]      = useState('')
  const navigate = useNavigate()

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    setStage('Uploading...')

    try {
      setStage('Parsing document...')
      const { data } = await uploadDocument(file, (pct) => {
        setProgress(pct)
        if (pct === 100) setStage('Generating embeddings & summary...')
      })
      toast.success(`"${file.name}" indexed successfully!`)
      window.dispatchEvent(new Event('docs:refresh'))
      navigate(`/chat/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
      setStage('')
    }
  }, [navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, disabled: uploading,
  })

  return (
    <div className="w-full">
      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-gray-700 hover:border-violet-500 hover:bg-violet-500/5'}
        ${uploading ? 'pointer-events-none opacity-80' : ''}
      `}>
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-4">
            <div className="text-4xl">⚙️</div>
            <p className="font-semibold text-gray-200">{stage}</p>
            <div className="w-full max-w-xs mx-auto bg-gray-800 rounded-full h-2">
              <div className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress || 20}%` }} />
            </div>
            <p className="text-sm text-gray-500">This may take 30–90 seconds for large files</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl">{isDragActive ? '📂' : '📤'}</div>
            <div>
              <p className="text-lg font-semibold text-gray-200">
                {isDragActive ? 'Drop it here!' : 'Drop your document here'}
              </p>
              <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
            </div>
            <div className="flex justify-center gap-2">
              {['PDF', 'DOCX', 'TXT'].map(t => (
                <span key={t} className="badge bg-gray-800 text-gray-400 border border-gray-700">{t}</span>
              ))}
            </div>
            <p className="text-xs text-gray-600">Max file size: 20MB</p>
          </div>
        )}
      </div>
    </div>
  )
}
