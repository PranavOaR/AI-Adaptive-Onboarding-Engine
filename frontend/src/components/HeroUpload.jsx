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
      className={`drop-zone flex flex-col items-center justify-center p-8 rounded cursor-pointer min-h-[200px] ${
        dragOver ? 'drag-over' : ''
      } ${file ? 'border-mc-cyan bg-mc-cyan/5' : ''}`}
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
      <div className="text-3xl mb-3 opacity-40">{icon}</div>
      <p className="font-mono text-sm text-mc-text2 mb-1">{label}</p>
      {file ? (
        <p className="font-mono text-xs text-mc-cyan mt-2 truncate max-w-[200px]">
          {file.name}
        </p>
      ) : (
        <p className="text-xs text-mc-text2/50 mt-1">
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
    <section className="min-h-screen grid-bg flex flex-col items-center justify-center px-6 relative">
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-mc-cyan/20 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.3; }
          to { transform: translateY(-20px) scale(1.5); opacity: 0.1; }
        }
      `}</style>

      <div className="relative z-10 max-w-3xl w-full">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-mc-cyan tracking-[0.3em] uppercase mb-4">
            AI Onboarding Engine
          </p>
          <h1 className="font-body text-4xl md:text-5xl font-light text-mc-text leading-tight mb-4">
            Show me who I am,
            <br />
            <span className="font-semibold text-mc-cyan">who I need to be.</span>
          </h1>
          <p className="text-mc-text2 text-sm max-w-md mx-auto">
            Upload your resume and a job description. Get a surgical, evidence-backed learning roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <UploadZone
            label="RESUME"
            accept=".pdf,.docx,.txt"
            file={resumeFile}
            onFile={setResumeFile}
            icon="01"
          />
          {useTextInput ? (
            <div className="drop-zone rounded p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-mc-text2">JOB DESCRIPTION</span>
                <button
                  className="font-mono text-[10px] text-mc-cyan hover:underline"
                  onClick={() => setUseTextInput(false)}
                >
                  UPLOAD FILE
                </button>
              </div>
              <textarea
                className="flex-1 bg-transparent border border-mc-border rounded p-3 text-sm text-mc-text font-body resize-none focus:outline-none focus:border-mc-cyan min-h-[140px]"
                placeholder="Paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
          ) : (
            <div className="relative">
              <UploadZone
                label="JOB DESCRIPTION"
                accept=".pdf,.docx,.txt"
                file={jdFile}
                onFile={setJdFile}
                icon="02"
              />
              <button
                className="absolute bottom-3 right-3 font-mono text-[10px] text-mc-cyan hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  setUseTextInput(true)
                }}
              >
                PASTE TEXT
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`font-mono text-sm tracking-widest px-10 py-3 rounded transition-all duration-300 ${
              canSubmit
                ? 'bg-mc-cyan/10 text-mc-cyan border border-mc-cyan hover:bg-mc-cyan/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)]'
                : 'bg-mc-border/30 text-mc-text2/40 border border-mc-border/50 cursor-not-allowed'
            }`}
          >
            RUN ANALYSIS &rarr;
          </button>
        </div>
      </div>
    </section>
  )
}
