import { useState } from 'react'
import Editor from '@monaco-editor/react'

export default function ConfigChallenge({ challenge, onClose }) {
  const [code, setCode] = useState(
    challenge.starterCode?.yaml || challenge.starterCode?.dockerfile || challenge.starterCode?.config || ''
  )
  const [verdict, setVerdict] = useState(null)

  const handleRun = () => {
    const isCorrect = challenge.id === 'CH006'
      ? code.includes('backend.service.name')
      : code.includes('EXPOSE 8080')

    setVerdict(isCorrect ? 'ACCEPTED' : 'WRONG ANSWER')
  }

  if (!challenge) return null

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-1 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">
            Configuration Challenge
          </span>
          <span className="text-xs text-text-dim">{challenge.id}</span>
          <span className="pill pill-warning">
            {challenge.difficulty}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-text-muted hover:text-error transition-colors px-3 py-1"
        >
          Close
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Context */}
        <div className="w-1/3 border-r border-border p-6 overflow-y-auto space-y-6 bg-surface-1">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              {challenge.title}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
              {challenge.description}
            </p>
          </div>

          <div className="card-static p-4">
            <h3 className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
              Objective
            </h3>
            <p className="text-sm text-text-body leading-relaxed">
              Identify the misconfiguration in the provided file and apply the correct fix to ensure the service deploys successfully.
            </p>
          </div>

          {verdict && (
            <div className={`card-static p-4 ${verdict === 'ACCEPTED' ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
               <h3 className={`text-sm font-semibold ${verdict === 'ACCEPTED' ? 'text-success' : 'text-error'}`}>
                 {verdict === 'ACCEPTED' ? 'Accepted' : 'Wrong Answer'}
               </h3>
               <p className="text-sm text-text-muted mt-2">
                 {verdict === 'ACCEPTED' ? 'The configuration is valid.' : 'The service failed to start. Review the required keys.'}
               </p>
            </div>
          )}
        </div>

        {/* Right Side: Editor */}
        <div className="w-2/3 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-1">
             <span className="text-xs font-medium text-text-muted">
                {challenge.id === 'CH006' ? 'config.yaml' : 'Dockerfile'}
             </span>
             <button
              onClick={handleRun}
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Verify
            </button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={challenge.id === 'CH006' ? 'yaml' : 'dockerfile'}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
