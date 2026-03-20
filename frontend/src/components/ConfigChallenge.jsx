import { useState } from 'react'
import Editor from '@monaco-editor/react'

export default function ConfigChallenge({ challenge, onClose }) {
  const [code, setCode] = useState(
    challenge.starterCode?.yaml || challenge.starterCode?.dockerfile || challenge.starterCode?.config || ''
  )
  const [verdict, setVerdict] = useState(null)

  const handleRun = () => {
    // Simple mock evaluation for MVP purposes
    const isCorrect = challenge.id === 'CH006' 
      ? code.includes('backend.service.name') 
      : code.includes('EXPOSE 8080')
      
    setVerdict(isCorrect ? 'ACCEPTED' : 'WRONG ANSWER')
  }

  if (!challenge) return null

  return (
    <div className="fixed inset-0 z-50 bg-mc-bg flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mc-border bg-mc-bg2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-mc-cyan tracking-[0.2em] uppercase">
            Configuration Challenge
          </span>
          <span className="font-mono text-[10px] text-mc-text2">{challenge.id}</span>
          <span className="badge border font-mono text-[9px] px-2 py-0.5 text-mc-amber border-mc-amber">
            {challenge.difficulty}
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-sm text-mc-text2 hover:text-mc-red transition-colors px-3 py-1"
        >
          ✕ CLOSE
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Context */}
        <div className="w-1/3 border-r border-mc-border p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="font-mono text-lg text-mc-cyan font-bold mb-2">
              {challenge.title}
            </h2>
            <p className="text-mc-text2 font-body text-sm leading-relaxed whitespace-pre-wrap">
              {challenge.description}
            </p>
          </div>
          
          <div className="p-4 border border-mc-border bg-mc-bg2 rounded">
            <h3 className="font-mono text-[10px] text-mc-cyan tracking-wider uppercase mb-2">
              Objective
            </h3>
            <p className="font-mono text-xs text-mc-text leading-relaxed">
              Identify the misconfiguration in the provided file and apply the correct fix to ensure the service deploys successfully.
            </p>
          </div>
          
          {verdict && (
            <div className={`p-4 border rounded ${verdict === 'ACCEPTED' ? 'border-mc-green bg-mc-green/10' : 'border-mc-red bg-mc-red/10'}`}>
               <h3 className={`font-mono text-sm font-bold ${verdict === 'ACCEPTED' ? 'text-mc-green' : 'text-mc-red'}`}>
                 {verdict === 'ACCEPTED' ? '✓ VERDICT: ACCEPTED' : '✗ VERDICT: WRONG ANSWER'}
               </h3>
               <p className="font-mono text-xs text-mc-text2 mt-2">
                 {verdict === 'ACCEPTED' ? 'The configuration is perfectly valid.' : 'The service failed to start. Review the required keys.'}
               </p>
            </div>
          )}
        </div>

        {/* Right Side: Editor */}
        <div className="w-2/3 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-mc-border bg-mc-bg2">
             <span className="font-mono text-[11px] text-mc-text2 uppercase tracking-widest">
                config.yaml / Dockerfile
             </span>
             <button
              onClick={handleRun}
              className="font-mono text-[11px] tracking-wider px-4 py-1.5 rounded border border-mc-amber text-mc-amber hover:bg-mc-amber/10 transition-all duration-200"
            >
              ▶ VERIFY CONFIG
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
                fontFamily: '"Space Mono", monospace',
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
