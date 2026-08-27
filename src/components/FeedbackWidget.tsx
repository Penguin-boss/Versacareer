import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquare, X, Star, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import toast from 'react-hot-toast'

export default function FeedbackWidget() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const submit = async () => {
    if (rating === 0) { toast.error('Please select a rating.'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        page: location.pathname,
        rating,
        comment: comment.trim() || null,
      })
      if (error) throw error
      toast.success('Thanks for your feedback!')
      setOpen(false)
      setRating(0)
      setComment('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-primary text-white shadow-glow flex items-center justify-center hover:bg-primary-hover transition-colors"
        aria-label="Give feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div 
      className="fixed bottom-5 right-5 z-40 w-80 card p-4 animate-slide-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
      ref={(el) => {
        if (el && !el.contains(document.activeElement)) {
          // simple focus on mount
          const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement
          if (focusable) focusable.focus()
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 id="feedback-title" className="font-medium text-sm">How is this page?</h3>
        <button onClick={() => setOpen(false)} className="text-text-faint hover:text-text" aria-label="Close feedback">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-label={`Rate ${n} out of 5`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                (hover || rating) >= n ? 'text-warning fill-warning' : 'text-text-faint'
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything we should improve? (optional)"
        className="input text-sm mb-3 min-h-[80px] resize-none"
      />
      <button onClick={submit} disabled={submitting} className="btn-primary w-full text-sm">
        {submitting ? 'Sending…' : 'Submit feedback'} <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
