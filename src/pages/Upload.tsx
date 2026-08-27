import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CloudUpload as UploadCloud, X, Sparkles, FileWarning } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { callEdgeFunction, supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { FREE_ANALYSES_PER_MONTH } from '../lib/types'
import toast from 'react-hot-toast'
import { AnalyzingDots } from '../components/icons/AnalyzingDots'
import { fadeOnly } from '../lib/motionVariants'
import { motion } from 'framer-motion'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['.pdf', '.docx', '.txt']

interface UsageInfo { analyses_count: number }

export default function Upload() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [scannedPdf, setScannedPdf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usedThisMonth, setUsedThisMonth] = useState<number | null>(null)

  const isFree = profile?.plan === 'FREE'

  const onPick = (f: File | null) => {
    setError('')
    setScannedPdf(false)
    if (!f) return
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) { setError('Only PDF or DOCX files are supported.'); return }
    if (f.size > MAX_BYTES) { setError('File exceeds 5MB limit.'); return }
    setFile(f)
  }

  const loadUsage = async () => {
    const mk = new Date().toISOString().slice(0, 7)
    const { data } = await supabase.from('usage_counters').select('analyses_count').eq('month_key', mk).maybeSingle()
    setUsedThisMonth((data as unknown as UsageInfo)?.analyses_count ?? 0)
  }

  useEffect(() => { loadUsage() }, []) // eslint-disable-line

  const analyze = async () => {
    if (!file || loading) return
    setLoading(true)
    setError('')
    setScannedPdf(false)
    try {
      const base64 = await fileToBase64(file)
      const res = await callEdgeFunction<{ analysis: any }>('analyze-resume', {
        fileName: file.name,
        mimeType: file.type || guessMime(file.name),
        base64,
      })
      toast.success('Resume analyzed!')
      navigate('/analysis', { state: { newId: res.analysis.id } })
    } catch (err: any) {
      if (err.code === 'LIMIT_REACHED') {
        toast.error(err.message)
        setUsedThisMonth(FREE_ANALYSES_PER_MONTH)
      } else if (err.code === 'SCANNED_PDF_DETECTED') {
        setScannedPdf(true)
      } else {
        setError(err.message || 'Analysis failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const remaining = isFree ? Math.max(0, FREE_ANALYSES_PER_MONTH - (usedThisMonth ?? 0)) : null

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader
        title="Resume Analyzer"
        subtitle="Upload your resume (PDF/DOCX, max 5MB). AI scores it across ATS, technical, experience, and project dimensions."
        icon={FileText}
      />

      {isFree && usedThisMonth !== null && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div className="text-sm text-text-muted">
            Free tier usage this month: <span className="text-text font-medium">{usedThisMonth} / {FREE_ANALYSES_PER_MONTH}</span> analyses
          </div>
          {remaining !== null && remaining <= 1 && (
            <span className="badge bg-warning/10 text-warning border border-warning/20">
              {remaining === 0 ? 'Limit reached' : '1 left'}
            </span>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0] ?? null) }}
        className="card border-dashed border-2 p-10 text-center cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload resume file, click or drag and drop"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-[2px] bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-text-muted">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="ml-2 text-text-faint hover:text-error"
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-bg-elev flex items-center justify-center">
              <UploadCloud className="h-7 w-7 text-text-faint" />
            </div>
            <div>
              <div className="font-medium">Drop your resume here, or click to browse</div>
              <div className="text-sm text-text-muted mt-1">PDF, DOCX, or TXT · max 5MB</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 mt-4 border-error/30 bg-error/5">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {scannedPdf && (
        <div className="card p-5 mt-4 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <FileWarning className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning mb-1">Scanned or image-based PDF detected</p>
              <p className="text-sm text-text-muted leading-relaxed">
                We couldn't find a text layer in this PDF — it looks like a scanned photo or image rather than a native text document. Please re-export your resume as a text-based PDF (from Word or Google Docs) or upload a DOCX file, then try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-text-faint flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini 2.5 Flash · processed server-side
        </p>
        <button onClick={analyze} disabled={!file || loading} className="btn-primary">
          {loading ? 'Analyzing…' : 'Analyze resume'}
        </button>
      </div>

      {loading && (
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <AnalyzingDots />
            <span className="text-sm text-text-muted">Extracting text and running AI analysis…</span>
          </div>
          <p className="text-xs text-text-faint">This usually takes 10-30 seconds. Please don't close this page.</p>
        </div>
      )}
    </motion.div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

function guessMime(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'text/plain'
}
