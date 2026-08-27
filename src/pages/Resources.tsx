import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, Search, Filter } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import type { Resource, ResourceType } from '../lib/types'
import { LoadingState, ErrorState, EmptyState } from '../components/ui'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

const TYPE_LABELS: Record<ResourceType, string> = {
  course: 'Course',
  book: 'Book',
  youtube: 'YouTube',
  github: 'GitHub',
  roadmap: 'Roadmap',
}

const TYPE_COLORS: Record<ResourceType, string> = {
  course: 'bg-primary/10 text-primary border-primary/20',
  book: 'bg-primary/10 text-primary border-primary/20',
  youtube: 'bg-error/10 text-error border-error/20',
  github: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  roadmap: 'bg-success/10 text-success border-success/20',
}

export default function Resources() {
  const { user } = useAuthStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('resources').select('*').eq('is_published', true).order('created_at', { ascending: false })
      if (error) throw error
      setResources((data ?? []) as unknown as Resource[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  const categories = Array.from(new Set(resources.map((r) => r.category))).sort()
  const types = Array.from(new Set(resources.map((r) => r.type)))

  const filtered = resources.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.title.toLowerCase().includes(q) || r.skill_tags.some((s) => s.toLowerCase().includes(q)) || r.category.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return <LoadingState label="Loading resources…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Resource Library" subtitle="Curated free courses, books, GitHub projects, and learning roadmaps." icon={BookOpen} />

      {/* Filters */}
      <motion.div variants={fadeSlideUp} className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
            <input
              className="input pl-10"
              aria-label="Search resources"
              placeholder="Search by title, skill, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select className="input min-w-[140px]" aria-label="Filter by resource type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t as ResourceType]}</option>)}
            </select>
            <select className="input min-w-[140px]" aria-label="Filter by resource category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState icon={Filter} title="No resources match your filters" description="Try clearing filters or searching for something else." />
      ) : (
        <motion.div variants={staggerContainer(50)} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <motion.div key={r.id} variants={fadeSlideUp}>
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 hover:border-primary/30 transition-colors group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`badge border ${TYPE_COLORS[r.type]}`}>{TYPE_LABELS[r.type]}</span>
                <ExternalLink className="h-4 w-4 text-text-faint group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-medium mb-2 line-clamp-2">{r.title}</h3>
              <div className="text-xs text-text-faint mb-3">{r.category}</div>
              {r.skill_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {r.skill_tags.slice(0, 4).map((s) => (
                    <span key={s} className="badge bg-bg-elev text-text-muted text-[10px]">{s}</span>
                  ))}
                </div>
              )}
            </a>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

