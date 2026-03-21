import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const QUICK_ACTIONS = [
  'What should I learn first?',
  'Explain my biggest gap',
  'Compare to Senior role',
  'Optimize my tech stack',
]

function UserBubble({ content }) {
  return (
    <div className="flex flex-col items-end w-full max-w-4xl mx-auto">
      <div className="p-5 rounded-2xl rounded-tr-none shadow-lg max-w-[80%] text-white text-sm leading-relaxed"
        style={{ background: 'linear-gradient(135deg, #0058be 0%, #2170e4 100%)' }}>
        {content}
      </div>
      <span className="text-[10px] text-on-surface-variant mt-2 mr-1 font-medium">Just now</span>
    </div>
  )
}

function AIBubble({ content, streaming }) {
  return (
    <div className="flex flex-col items-start w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0058be" strokeWidth="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          </svg>
        </div>
        <span className="text-sm font-bold text-on-surface font-headline">Skilo AI</span>
      </div>
      <div className="bg-surface-container-lowest p-6 rounded-2xl rounded-tl-none border border-outline-variant/10 shadow-sm max-w-[85%] text-on-surface">
        {streaming && !content ? (
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-on-surface-variant/40"
                style={{ animation: `bounce 1s ${i * 0.15}s infinite` }} />
            ))}
            <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I've analyzed your resume and skill gaps. Ask me anything about your roadmap, skill gaps, or interview preparation." }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef()
  const textareaRef = useRef()

  const analysisData = (() => {
    try { return JSON.parse(sessionStorage.getItem('skilo_analysis') || 'null') } catch { return null }
  })()

  const gapSkills = analysisData?.gaps
    ?.filter(g => g.status === 'missing' || g.status === 'partial')
    ?.slice(0, 3)
    ?.map(g => g.skill.replace(/_/g, ' ')) || []

  const roleTitle = analysisData?.summary?.role_display_name ||
    (analysisData?.summary?.detected_role || '').replace(/_/g, ' ')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || streaming) return

    const history = messages.slice(1)
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const token = localStorage.getItem('mc_token')
      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          history: history.map(m => ({ role: m.role, content: m.content })),
          analysisContext: analysisData,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: `Error: ${err}` }
          return next
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const current = buffer
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: current }
          return next
        })
      }
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: `Connection error: ${err.message}` }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. What would you like to know?" }])
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-surface-container-low flex flex-col p-6 h-full shrink-0">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-2">
          <button onClick={() => navigate('/app')} className="font-headline text-2xl font-black text-primary tracking-tighter hover:opacity-80 transition-opacity">
            Skilo
          </button>
        </div>

        {/* AI Status */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant font-headline">AI Assistant</span>
            <span className="flex h-2 w-2 relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-600 font-bold tracking-widest ml-auto">LIVE</span>
          </div>

          {/* Analysis Context Card */}
          {analysisData && (
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0058be" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="text-xs font-semibold text-on-surface">Analysis Context</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">{roleTitle || 'Your Role'}</p>
                <p className="text-[11px] text-on-surface-variant mt-1">AI has full context of your analysis.</p>
              </div>
              {gapSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {gapSkills.map(s => (
                    <span key={s} className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!analysisData && (
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
              <p className="text-xs text-on-surface-variant">No analysis loaded.</p>
              <button onClick={() => navigate('/app')} className="text-xs text-primary font-bold mt-2 hover:underline">
                Run an analysis first →
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-3">Quick Actions</span>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="w-full text-left p-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-white hover:text-primary transition-all flex items-center justify-between group"
            >
              {action}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>

        {/* User Footer */}
        {user && (
          <div className="pt-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-on-surface truncate">{user.name || 'User'}</span>
                <span className="text-[11px] text-on-surface-variant truncate">{user.email}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-surface relative overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-outline-variant/10 shrink-0">
          <h1 className="font-headline text-xl font-bold text-on-surface">Chat</h1>
          <button
            onClick={clearChat}
            className="text-sm font-medium text-on-surface-variant hover:text-error transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Clear conversation
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.map((msg, i) => (
            msg.role === 'user'
              ? <UserBubble key={i} content={msg.content} />
              : <AIBubble key={i} content={msg.content} streaming={streaming && i === messages.length - 1} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="p-8 pt-0 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3 bg-surface-container-low p-3 pl-5 rounded-2xl border border-outline-variant/10">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Skilo anything about your skills..."
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
              <div className="flex items-center gap-2 pb-1 pr-1">
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || streaming}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #0058be 0%, #2170e4 100%)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">
                Powered by Groq Intelligence
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
