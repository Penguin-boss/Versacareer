import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { FREE_CHAT_PER_MONTH, type ChatMessage } from '../lib/types'
import { LoadingState, ErrorState } from '../components/ui'
import toast from 'react-hot-toast'
import { PulsingMentorIcon } from '../components/icons/PulsingMentorIcon'
import { AnalyzingDots } from '../components/icons/AnalyzingDots'
import { fadeOnly } from '../lib/motionVariants'
import { motion } from 'framer-motion'

const SUGGESTIONS = [
  'What roles am I currently suited for?',
  'How do I close my biggest skill gaps?',
  'What should I learn this week?',
  'How can I improve my resume score?',
]

export default function Mentor() {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [usedThisMonth, setUsedThisMonth] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isFree = profile?.plan === 'FREE'
  const limitReached = isFree && usedThisMonth !== null && usedThisMonth >= FREE_CHAT_PER_MONTH

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMessages((data ?? []) as unknown as ChatMessage[])
      // Usage
      const mk = new Date().toISOString().slice(0, 7)
      const { data: uc } = await supabase.from('usage_counters').select('chat_count').eq('month_key', mk).maybeSingle()
      setUsedThisMonth((uc as any)?.chat_count ?? 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || sending || limitReached) return
    setSending(true)
    setInput('')
    // Optimistic
    const tempId = 'temp-' + Date.now()
    setMessages((prev) => [...prev, { id: tempId, user_id: user!.id, role: 'user', content, created_at: new Date().toISOString() }])
    try {
      const res = await callEdgeFunction<{ reply: string }>('mentor-chat', { message: content })
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: 'u-' + Date.now(), user_id: user!.id, role: 'user', content, created_at: new Date().toISOString() },
        { id: 'a-' + Date.now(), user_id: user!.id, role: 'assistant', content: res.reply, created_at: new Date().toISOString() },
      ])
      setUsedThisMonth((n) => (n ?? 0) + 1)
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      if (err.code === 'LIMIT_REACHED') {
        setUsedThisMonth(FREE_CHAT_PER_MONTH)
        toast.error(err.message)
      } else {
        toast.error(err.message || 'Mentor failed to respond.')
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingState label="Loading chat…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly} className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-100px)]">
      <PageHeader title="AI Career Mentor" subtitle="Direct, practical advice tailored to your scores, skills, and gaps." icon={MessageSquare} />

      {isFree && usedThisMonth !== null && (
        <div className="card p-3 mb-4 flex items-center justify-between text-sm">
          <span className="text-text-muted">Messages this month: <span className="text-text font-medium">{usedThisMonth} / {FREE_CHAT_PER_MONTH}</span></span>
          <span className="text-xs text-text-faint flex items-center gap-1"><Sparkles className="h-3 w-3" /> Claude-powered</span>
        </div>
      )}

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="h-14 w-14 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
                <PulsingMentorIcon className="h-7 w-7" />
              </div>
              <h3 className="font-medium mb-1 flex items-center justify-center gap-2"><span className="diamond-accent" /> Ask your AI mentor anything <span className="diamond-accent" /></h3>
              <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
                Your mentor knows your latest resume score, skills, and gaps. Try one of these:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={limitReached} className="text-left rounded-[2px] border border-border bg-bg-soft p-3 text-sm text-text-muted hover:border-primary/40 hover:text-text transition-colors disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[4px] px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-bg-elev text-text rounded-bl-sm border border-border'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-bg-elev border border-border rounded-[4px] rounded-bl-sm px-4 py-3">
                <AnalyzingDots />
              </div>
            </div>
          )}
        </div>

        {limitReached ? (
          <div className="border-t border-border p-4 text-center">
            <p className="text-sm text-warning mb-2">You've reached your free monthly mentor limit ({FREE_CHAT_PER_MONTH} messages).</p>
            <p className="text-xs text-text-faint">Upgrade to PRO for unlimited mentor conversations.</p>
          </div>
        ) : (
          <div className="border-t border-border p-3 md:p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input) }}
              className="flex gap-2"
            >
              <input
                id="mentor-input"
                aria-label="Your message to the mentor"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor…"
                className="input flex-1"
                disabled={sending}
              />
              <button type="submit" disabled={sending || !input.trim()} className="btn-accent" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  )
}
