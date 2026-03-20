import { useState, useRef, useCallback } from 'react'

const UploadZone = ({ label, accept, file, onFile, icon }) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) onFile(f)
    },
    [onFile]
  )

  return (
    <div
      className={`drop-zone flex flex-col items-center justify-center p-8 cursor-pointer min-h-[180px] ${
        dragOver ? 'drag-over' : ''
      } ${file ? 'border-accent bg-accent/5' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className="text-2xl mb-2 text-text-dim opacity-60">{icon}</div>
      <p className="text-sm font-medium text-text-muted mb-1">{label}</p>
      {file ? (
        <p className="text-xs text-accent mt-2 truncate max-w-[200px]">
          {file.name}
        </p>
      ) : (
        <p className="text-xs text-text-dim mt-1">
          Drop file or click to browse
        </p>
      )}
    </div>
  )
}

export default function HeroUpload({ onSubmit }) {
  const [resumeFile, setResumeFile] = useState(null)
  const [jdFile, setJdFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [useTextInput, setUseTextInput] = useState(false)

  const canSubmit = resumeFile && (jdFile || jdText.trim())

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ resumeFile, jdFile: useTextInput ? null : jdFile, jdText: useTextInput ? jdText : '' })
  }

  return (
    <section className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 relative">
      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-accent tracking-wide mb-4">
            AI Onboarding Engine
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-text-primary leading-tight mb-5">
            Show me who I am,
            <br />
            <span className="text-accent">who I need to be.</span>
          </h1>
          <p className="text-text-muted text-base max-w-lg mx-auto leading-relaxed">
            Upload your resume and a job description to get an evidence-backed skill analysis and personalized learning roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <UploadZone
            label="Resume"
            accept=".pdf,.docx,.txt"
            file={resumeFile}
            onFile={setResumeFile}
            icon="01"
          />
          {useTextInput ? (
            <div className="drop-zone p-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-muted">Job Description</span>
                <button
                  className="text-xs text-accent hover:text-accent-hover transition-colors"
                  onClick={() => setUseTextInput(false)}
                >
                  Upload file instead
                </button>
              </div>
              <textarea
                className="flex-1 bg-surface-1 border border-border rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent min-h-[130px]"
                placeholder="Paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
          ) : (
            <div className="relative">
              <UploadZone
                label="Job Description"
                accept=".pdf,.docx,.txt"
                file={jdFile}
                onFile={setJdFile}
                icon="02"
              />
              <button
                className="absolute bottom-3 right-3 text-xs text-accent hover:text-accent-hover transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setUseTextInput(true)
                }}
              >
                Paste text instead
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`text-sm font-medium px-10 py-3 rounded-lg transition-all duration-200 ${
              canSubmit
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
            }`}
          >
            Analyze
          </button>
        </div>
      </div>
    </section>
  )
}
