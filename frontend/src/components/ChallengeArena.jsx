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
const DIFFICULTY_COLORS = {
  easy: 'text-mc-green border-mc-green',
  medium: 'text-mc-amber border-mc-amber',
  hard: 'text-mc-red border-mc-red',
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
        background: '#0A0C10',
        foreground: '#E8EDF2',
        cursor: '#00E5FF',
        selectionBackground: '#1E2530',
        black: '#0A0C10',
        brightBlack: '#8896A6',
        green: '#00E676',
        brightGreen: '#00E676',
        yellow: '#FFB300',
        brightYellow: '#FFB300',
        cyan: '#00E5FF',
        brightCyan: '#00E5FF',
        red: '#FF5252',
        brightRed: '#FF5252',
      },
      fontFamily: '"Space Mono", monospace',
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

    term.writeln('\x1b[36m╔══════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[36m║   MISSION CONTROL — CODE TERMINAL    ║\x1b[0m')
    term.writeln('\x1b[36m╚══════════════════════════════════════╝\x1b[0m')
    term.writeln('\x1b[90m  Write your solution, then press RUN\x1b[0m\r\n')

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
    term.writeln('\x1b[33m▶ Submitting to Judge0 CE...\x1b[0m')

    try {
      const body = {
        source_code: code,
        language_id: JUDGE0_LANGUAGE_IDS[language],
        stdin: problem.testCases[0]?.input || '',
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
        term.writeln('\x1b[31m--- COMPILE ERROR ---\x1b[0m')
        result.compile_output.split('\n').forEach((line) => term.writeln('\x1b[31m' + line + '\x1b[0m'))
      }

      if (result.stderr) {
        term.writeln('\x1b[31m--- RUNTIME ERROR ---\x1b[0m')
        result.stderr.split('\n').forEach((line) => term.writeln('\x1b[31m' + line + '\x1b[0m'))
      }

      if (result.stdout) {
        term.writeln('\x1b[32m--- OUTPUT ---\x1b[0m')
        result.stdout.split('\n').forEach((line) => term.writeln(line))
      }

      if (!result.stdout && !result.stderr && !result.compile_output) {
        term.writeln('\x1b[90m(no output)\x1b[0m')
      }

      // Verdict
      const expected = problem.testCases[0]?.expectedOutput?.trim()
      const actual = (result.stdout || '').trim()
      const firstLine = actual.split('\n')[0]
      const passed = expected ? firstLine === expected || actual === expected : false

      term.writeln('')
      if (passed) {
        term.writeln('\x1b[32m✓ VERDICT: ACCEPTED\x1b[0m')
      } else if (result.compile_output || result.stderr) {
        term.writeln('\x1b[31m✗ VERDICT: ERROR\x1b[0m')
      } else {
        term.writeln('\x1b[31m✗ VERDICT: WRONG ANSWER\x1b[0m')
        if (expected) {
          term.writeln('\x1b[90m  Expected: ' + expected + '\x1b[0m')
          term.writeln('\x1b[90m  Got:      ' + firstLine + '\x1b[0m')
        }
      }

      if (result.time) {
        term.writeln('\x1b[90m  Time: ' + result.time + 's | Memory: ' + (result.memory || '?') + 'KB\x1b[0m')
      }
    } catch (err) {
      term.writeln('\x1b[31m✗ Connection error: ' + err.message + '\x1b[0m')
      term.writeln('\x1b[90m  Judge0 CE public endpoint may be rate-limited. Try again.\x1b[0m')
    }

    term.writeln('\x1b[90m─────────────────────────────────────\x1b[0m\r\n')
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
    <div className="fixed inset-0 z-50 bg-mc-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-mc-border bg-mc-bg2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-mc-cyan tracking-[0.2em] uppercase">
            Challenge Arena
          </span>
          <span className="font-mono text-[10px] text-mc-text2">{problem.id}</span>
          <span className={`badge border font-mono text-[9px] px-2 py-0.5 ${DIFFICULTY_COLORS[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-sm text-mc-text2 hover:text-mc-red transition-colors px-3 py-1"
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Body — 3 panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Problem sidebar */}
        <div className="w-72 shrink-0 border-r border-mc-border overflow-y-auto p-4 space-y-4">
          <h2 className="font-mono text-sm text-mc-cyan font-bold">{problem.title}</h2>

          <div className="text-xs text-mc-text2 font-body leading-relaxed whitespace-pre-wrap">
            {problem.description.replace(/`([^`]+)`/g, '$1')}
          </div>

          <div>
            <p className="font-mono text-[10px] text-mc-text2 tracking-wider uppercase mb-2">
              Examples
            </p>
            {problem.examples.map((ex, i) => (
              <div key={i} className="card-glow p-3 mb-2 text-[11px]">
                <p className="font-mono text-mc-text2 mb-1">Input:</p>
                <p className="font-mono text-mc-text bg-mc-bg px-2 py-1 rounded mb-2 text-[10px] break-all">
                  {ex.input}
                </p>
                <p className="font-mono text-mc-text2 mb-1">Output:</p>
                <p className="font-mono text-mc-green bg-mc-bg px-2 py-1 rounded mb-2 text-[10px]">
                  {ex.output}
                </p>
                <p className="text-mc-text2/70 font-body text-[10px]">{ex.explanation}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="font-mono text-[10px] text-mc-text2 tracking-wider uppercase mb-2">
              Constraints
            </p>
            <ul className="space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i} className="font-mono text-[10px] text-mc-text2 flex gap-2">
                  <span className="text-mc-cyan shrink-0">·</span> {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-1">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[9px] px-2 py-0.5 border border-mc-border text-mc-text2 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Panel 2: Monaco Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-mc-border bg-mc-bg2 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="font-mono text-[11px] bg-mc-bg border border-mc-border text-mc-cyan px-3 py-1.5 rounded focus:outline-none focus:border-mc-cyan"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>

            <button
              onClick={handleRun}
              disabled={running}
              className={`font-mono text-[11px] tracking-wider px-4 py-1.5 rounded border transition-all duration-200 ${
                running
                  ? 'border-mc-amber/40 text-mc-amber/40 cursor-not-allowed'
                  : 'border-mc-amber text-mc-amber hover:bg-mc-amber/10'
              }`}
            >
              {running ? 'RUNNING...' : '▶ RUN'}
            </button>

            <span className="font-mono text-[10px] text-mc-text2 ml-auto">
              {problem.skills.map((s) => s.toUpperCase()).join(' · ')}
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
                fontFamily: '"Space Mono", monospace',
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
        <div className="w-80 shrink-0 border-l border-mc-border flex flex-col bg-mc-bg">
          <div className="px-4 py-2 border-b border-mc-border bg-mc-bg2 shrink-0">
            <span className="font-mono text-[10px] text-mc-text2 tracking-wider uppercase">
              Execution Output
            </span>
          </div>
          <div ref={termRef} className="flex-1 overflow-hidden p-2" />
        </div>
      </div>
    </div>
  )
}
