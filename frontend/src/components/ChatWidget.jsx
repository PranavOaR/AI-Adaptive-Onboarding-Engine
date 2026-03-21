import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
      )}
      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-surface-2 text-text-body border border-border rounded-bl-sm'
        }`}
      >
        {msg.content || <span className="opacity-40">…</span>}
      </div>
    </div>
  )
}

export default function ChatWidget({ analysisData, user }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'ve analyzed your resume. Ask me anything about your skill gaps, roadmap, or interview prep.' }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const drawerRef = useRef()
  const btnRef = useRef()
  const messagesEndRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    gsap.fromTo(btnRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, delay: 1, ease: 'back.out(1.7)' }
    )
  }, [])

  useEffect(() => {
    if (open) {
      gsap.fromTo(drawerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.4)' }
      )
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg = { role: 'user', content: text }
    const history = messages.slice(1) // exclude the initial greeting
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Add placeholder for assistant
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
          message: text,
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

  return (
    <>
      {/* Floating button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-accent hover:bg-accent-hover shadow-xl shadow-accent/30 flex items-center justify-center transition-colors"
        title="Ask the AI assistant"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat drawer */}
      {open && (
        <div
          ref={drawerRef}
          className="fixed right-6 z-50 w-80 sm:w-96 bg-surface-1 border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ bottom: '5.5rem', height: '480px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-medium text-text-primary">Assistant</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl rounded-bl-sm px-3.5 py-3 flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-text-dim" style={{ animation: `bounce 1s ${i*0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border">
            <div className="flex items-end gap-2 bg-surface-0 border border-border rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your roadmap, gaps…"
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-dim resize-none focus:outline-none min-h-[1.5rem] max-h-24"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="w-7 h-7 rounded-lg bg-accent hover:bg-accent-hover flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p className="text-[10px] text-text-dim text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  )
}
