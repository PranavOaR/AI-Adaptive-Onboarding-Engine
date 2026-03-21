import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import challenges from '../data/challenges.json'
import MCQChallenge from './MCQChallenge'
import ScenarioChallenge from './ScenarioChallenge'
import ConfigChallenge from './ConfigChallenge'

const JUDGE0_LANGUAGE_IDS = { python: 71, javascript: 63, java: 62 }
const DIFFICULTY_PILL = {
  easy: 'pill-success',
  medium: 'pill-warning',
  hard: 'pill-error',
  beginner: 'pill-success',
  intermediate: 'pill-warning',
  advanced: 'pill-error',
}

export default function ChallengeArena({ challengeId, onClose }) {
  const problem = challenges.find((c) => c.id === challengeId)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(problem?.starterCode?.python || '')
  const [running, setRunning] = useState(false)
  const termRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)

  useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      theme: {
        background: '#111318',
        foreground: '#D1D5DB',
        cursor: '#818CF8',
        selectionBackground: '#2A2D36',
        black: '#111318',
        brightBlack: '#6B7280',
        green: '#34D399',
        brightGreen: '#34D399',
        yellow: '#FBBF24',
        brightYellow: '#FBBF24',
        cyan: '#818CF8',
        brightCyan: '#818CF8',
        red: '#F87171',
        brightRed: '#F87171',
      },
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: 12,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 500,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    fitAddon.fit()

    term.writeln('\x1b[90mReady. Write your solution and press Run.\x1b[0m\r\n')

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [])

  useEffect(() => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language])
    }
  }, [language, problem])

  const handleRun = async () => {
    if (!xtermRef.current || running) return
    setRunning(true)
    const term = xtermRef.current

    term.writeln('')
    term.writeln('\x1b[33mSubmitting...\x1b[0m')

    try {
      const body = {
        source_code: code,
        language_id: JUDGE0_LANGUAGE_IDS[language],
        stdin: problem.testCases?.[0]?.input || '',
      }

      const response = await fetch('/judge0/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error(`Judge0 error: ${response.status}`)
      const result = await response.json()

      term.writeln('')
      if (result.compile_output) {
        term.writeln('\x1b[31m--- Compile Error ---\x1b[0m')
        result.compile_output.split('\n').forEach((line) => term.writeln('\x1b[31m' + line + '\x1b[0m'))
      }

      if (result.stderr) {
        term.writeln('\x1b[31m--- Runtime Error ---\x1b[0m')
        result.stderr.split('\n').forEach((line) => term.writeln('\x1b[31m' + line + '\x1b[0m'))
      }

      if (result.stdout) {
        term.writeln('\x1b[32m--- Output ---\x1b[0m')
        result.stdout.split('\n').forEach((line) => term.writeln(line))
      }

      if (!result.stdout && !result.stderr && !result.compile_output) {
        term.writeln('\x1b[90m(no output)\x1b[0m')
      }

      const expected = problem.testCases?.[0]?.expectedOutput?.trim()
      const actual = (result.stdout || '').trim()
      const firstLine = actual.split('\n')[0]
      const passed = expected ? firstLine === expected || actual === expected : false

      term.writeln('')
      if (passed) {
        term.writeln('\x1b[32mAccepted\x1b[0m')
      } else if (result.compile_output || result.stderr) {
        term.writeln('\x1b[31mError\x1b[0m')
      } else {
        term.writeln('\x1b[31mWrong Answer\x1b[0m')
        if (expected) {
          term.writeln('\x1b[90m  Expected: ' + expected + '\x1b[0m')
          term.writeln('\x1b[90m  Got:      ' + firstLine + '\x1b[0m')
        }
      }

      if (result.time) {
        term.writeln('\x1b[90m  Time: ' + result.time + 's | Memory: ' + (result.memory || '?') + 'KB\x1b[0m')
      }
    } catch (err) {
      term.writeln('\x1b[31mConnection error: ' + err.message + '\x1b[0m')
      term.writeln('\x1b[90m  Judge0 CE may be rate-limited. Try again.\x1b[0m')
    }

    term.writeln('\x1b[90m' + '\u2500'.repeat(36) + '\x1b[0m\r\n')
    setRunning(false)
  }

  if (!problem) return null

  if (problem.challenge_type === 'mcq_concept') {
    return <MCQChallenge challenge={problem} onClose={onClose} />
  }

  if (problem.challenge_type === 'scenario_analysis') {
    return <ScenarioChallenge challenge={problem} onClose={onClose} />
  }

  if (problem.challenge_type === 'practical_config') {
    return <ConfigChallenge challenge={problem} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-1 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">
            Challenge
          </span>
          <span className="text-xs text-text-dim">{problem.id}</span>
          <span className={`pill ${DIFFICULTY_PILL[problem.difficulty] || 'pill-neutral'}`}>
            {problem.difficulty}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-text-muted hover:text-error transition-colors px-3 py-1"
        >
          Close
        </button>
      </div>

      {/* Body — 3 panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Problem sidebar */}
        <div className="w-72 shrink-0 border-r border-border overflow-y-auto p-5 space-y-5 bg-surface-1">
          <h2 className="text-base font-semibold text-text-primary">{problem.title}</h2>

          <div className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {problem.description.replace(/`([^`]+)`/g, '$1')}
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted mb-2">
              Examples
            </p>
            {problem.examples?.map((ex, i) => (
              <div key={i} className="card-static p-3 mb-2">
                <p className="text-xs text-text-muted mb-1">Input:</p>
                <p className="text-xs text-text-primary bg-surface-0 px-2 py-1 rounded-md mb-2 break-all font-mono">
                  {ex.input}
                </p>
                <p className="text-xs text-text-muted mb-1">Output:</p>
                <p className="text-xs text-success bg-surface-0 px-2 py-1 rounded-md mb-2 font-mono">
                  {ex.output}
                </p>
                <p className="text-xs text-text-dim leading-relaxed">{ex.explanation}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted mb-2">
              Constraints
            </p>
            <ul className="space-y-1">
              {problem.constraints?.map((c, i) => (
                <li key={i} className="text-xs text-text-muted flex gap-2">
                  <span className="text-text-dim shrink-0">-</span> {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {problem.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-surface-0 border border-border-subtle rounded-md text-text-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Panel 2: Monaco Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface-1 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm bg-surface-0 border border-border text-accent px-3 py-1.5 rounded-lg focus:outline-none focus:border-accent"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>

            <button
              onClick={handleRun}
              disabled={running}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                running
                  ? 'bg-accent/50 text-white/60 cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent-hover'
              }`}
            >
              {running ? 'Running...' : 'Run'}
            </button>

            <span className="text-xs text-text-dim ml-auto">
              {problem.skills.map((s) => s.replace(/_/g, ' ')).join(' / ')}
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'python' ? 'python' : language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                padding: { top: 12, bottom: 12 },
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Panel 3: Xterm terminal */}
        <div className="w-80 shrink-0 border-l border-border flex flex-col bg-surface-0">
          <div className="px-4 py-2.5 border-b border-border bg-surface-1 shrink-0">
            <span className="text-xs font-medium text-text-muted">
              Output
            </span>
          </div>
          <div ref={termRef} className="flex-1 overflow-hidden p-2" />
        </div>
      </div>
    </div>
  )
}
