import { useEffect, useState } from 'react'
import { Shield, Users, ChartBar as BarChart3, Cpu, Flag, BookOpen, MessageSquare, Search, Trash2, Plus, X, TriangleAlert as AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { callEdgeFunction } from '../lib/supabase'
import { LoadingState, ErrorState } from '../components/ui'
import { type Resource, type ResourceType } from '../lib/types'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

type Tab = 'stats' | 'users' | 'resources' | 'feedback' | 'flags' | 'ai'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('stats')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [aiLogs, setAiLogs] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  const loadTab = async (t: Tab) => {
    setLoading(true); setError('')
    try {
      if (t === 'stats') {
        const r = await callEdgeFunction<{ stats: any }>('admin-api', { action: 'stats' })
        setStats(r.stats)
      } else if (t === 'users') {
        const r = await callEdgeFunction<{ users: any[] }>('admin-api', { action: 'list_users' })
        setUsers(r.users)
      } else if (t === 'resources') {
        const r = await callEdgeFunction<{ resources: Resource[] }>('admin-api', { action: 'list_resources' })
        setResources(r.resources)
      } else if (t === 'feedback') {
        const r = await callEdgeFunction<{ feedback: any[] }>('admin-api', { action: 'list_feedback' })
        setFeedback(r.feedback)
      } else if (t === 'flags') {
        const r = await callEdgeFunction<{ flags: any[] }>('admin-api', { action: 'list_flags' })
        setFlags(r.flags)
      } else if (t === 'ai') {
        const r = await callEdgeFunction<{ logs: any[] }>('admin-api', { action: 'ai_usage' })
        setAiLogs(r.logs)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTab(tab) }, [tab]) // eslint-disable-line

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'flags', label: 'Feature Flags', icon: Flag },
    { id: 'ai', label: 'AI Usage', icon: Cpu },
  ]

  const updatePlan = async (userId: string, plan: string) => {
    try {
      await callEdgeFunction('admin-api', { action: 'update_user_plan', userId, plan })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u))
      toast.success(`Plan set to ${plan}`)
    } catch (err: any) { toast.error(err.message) }
  }

  const updateRole = async (userId: string, role: string) => {
    try {
      await callEdgeFunction('admin-api', { action: 'update_user_role', userId, role })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
      toast.success(`Role set to ${role}`)
    } catch (err: any) { toast.error(err.message) }
  }

  const toggleFlag = async (key: string, is_enabled: boolean) => {
    try {
      await callEdgeFunction('admin-api', { action: 'toggle_flag', key, is_enabled })
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, is_enabled } : f))
      toast.success(`Flag ${key} ${is_enabled ? 'enabled' : 'disabled'}`)
    } catch (err: any) { toast.error(err.message) }
  }

  const deleteResource = async (id: string) => {
    if (!confirm('Delete this resource?')) return
    try {
      await callEdgeFunction('admin-api', { action: 'delete_resource', id })
      setResources((prev) => prev.filter((r) => r.id !== id))
      toast.success('Deleted')
    } catch (err: any) { toast.error(err.message) }
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Admin Panel" subtitle="Manage users, monitor usage, and curate content. All actions are permission-gated server-side." icon={Shield} />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {tab === t.id && <div className="diamond-accent" />}
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => loadTab(tab)} /> : (
        <>
          {tab === 'stats' && stats && (
            <motion.div variants={staggerContainer(40)} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Resumes Analyzed" value={stats.totalAnalyses} />
              <StatCard label="Pro Subscribers" value={stats.proUsers} />
              <StatCard label="Pro+ Subscribers" value={stats.proPlusUsers} />
              <StatCard label="Founder Passes Sold" value={`${stats.founderSold ?? 0} / ${stats.founderCap ?? 50}`} />
              <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} />
              <StatCard label="Daily Active" value={stats.dau} />
              <StatCard label="Weekly Active" value={stats.wau} />
              <StatCard label="AI Calls (all)" value={stats.aiCalls} />
              <StatCard label="AI Cost (USD)" value={`${stats.aiCostUsd}`} />
              <StatCard label="Avg Feedback Rating" value={`${stats.avgRating} / 5`} />
            </motion.div>
          )}

          {tab === 'stats' && stats && stats.priceMismatches && stats.priceMismatches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Founder Pass Price Mismatches
              </h3>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted text-xs uppercase">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Position</th>
                      <th className="text-right p-3">Expected</th>
                      <th className="text-right p-3">Charged</th>
                      <th className="text-left p-3">Direction</th>
                      <th className="text-left p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.priceMismatches.map((m: any) => (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="p-3 text-xs">{m.email ?? m.user_id}</td>
                        <td className="p-3">#{m.position}</td>
                        <td className="p-3 text-right text-xs">₹{(m.expected_price / 100).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-xs">₹{(m.charged_price / 100).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`badge ${m.direction === 'OVERPAID' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {m.direction}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-text-faint">{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div className="relative max-w-sm mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
                <input className="input pl-10" aria-label="Search users" placeholder="Search by name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted text-xs uppercase">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Plan</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Usage (this month)</th>
                      <th className="text-left p-3">Joined</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="p-3">
                          <div className="font-medium">{u.name ?? '—'}</div>
                          <div className="text-xs text-text-faint">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <select value={u.plan} onChange={(e) => updatePlan(u.id, e.target.value)} className="input text-xs py-1">
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                            <option value="PRO_PLUS">PRO+</option>
                            <option value="FOUNDER">FOUNDER</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="input text-xs py-1">
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="p-3 text-xs text-text-muted">
                          {u.usage ? `${u.usage.analyses_count ?? 0} analyses · ${u.usage.chat_count ?? 0} chat · ${u.usage.resumes_generations_count ?? 0} gen` : '—'}
                        </td>
                        <td className="p-3 text-xs text-text-faint">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'resources' && (
            <ResourceManager resources={resources} onChange={() => loadTab('resources')} onDelete={deleteResource} />
          )}

          {tab === 'feedback' && (
            <div className="space-y-3">
              {feedback.length === 0 ? <p className="text-sm text-text-faint">No feedback yet.</p> : feedback.map((f) => (
                <div key={f.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium">{f.user?.email ?? 'Unknown'}</div>
                      <div className="text-xs text-text-faint">{f.page} · {new Date(f.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={n <= f.rating ? 'text-warning' : 'text-text-faint'}>★</span>
                      ))}
                    </div>
                  </div>
                  {f.comment && <p className="text-sm text-text-muted">{f.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'flags' && (
            <div className="card p-2">
              {flags.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{f.key}</div>
                    <div className="text-xs text-text-faint">Updated {new Date(f.updated_at).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => toggleFlag(f.key, !f.is_enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${f.is_enabled ? 'bg-success' : 'bg-bg-elev'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${f.is_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'ai' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase">
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Service</th>
                    <th className="text-left p-3">Feature</th>
                    <th className="text-right p-3">Tokens (in/out)</th>
                    <th className="text-right p-3">Cost (USD)</th>
                    <th className="text-left p-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {aiLogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-text-faint">No AI calls logged yet.</td></tr>
                  ) : aiLogs.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-xs">{l.email}</td>
                      <td className="p-3"><span className={`badge ${l.service === 'gemini' ? 'bg-primary-soft text-primary' : 'bg-primary-soft text-primary'}`}>{l.service}</span></td>
                      <td className="p-3 text-xs">{l.feature}</td>
                      <td className="p-3 text-right text-xs">{l.tokens_in} / {l.tokens_out}</td>
                      <td className="p-3 text-right text-xs">${Number(l.estimated_cost_usd).toFixed(4)}</td>
                      <td className="p-3 text-xs text-text-faint">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
      <div className="text-xs text-text-faint mb-2 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </motion.div>
  )
}

function ResourceManager({ resources, onChange, onDelete }: { resources: Resource[]; onChange: () => void; onDelete: (id: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', type: 'course' as ResourceType, category: '', skill_tags: '' })

  const create = async () => {
    if (!form.title || !form.url) { toast.error('Title and URL required.'); return }
    try {
      await callEdgeFunction('admin-api', { action: 'create_resource', resource: {
        title: form.title, url: form.url, type: form.type, category: form.category || 'General',
        skill_tags: form.skill_tags.split(',').map((s) => s.trim()).filter(Boolean),
      }})
      setShowForm(false); setForm({ title: '', url: '', type: 'course', category: '', skill_tags: '' })
      onChange()
      toast.success('Resource created')
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-medium">{resources.length} resources</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add resource</>}
        </button>
      </div>
      {showForm && (
        <div className="card p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <input className="input" aria-label="Resource title" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" aria-label="Resource URL" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <select className="input" aria-label="Resource type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}>
            <option value="course">Course</option>
            <option value="book">Book</option>
            <option value="youtube">YouTube</option>
            <option value="github">GitHub</option>
            <option value="roadmap">Roadmap</option>
          </select>
          <input className="input" aria-label="Resource category" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="input sm:col-span-2" aria-label="Skill tags" placeholder="Skill tags (comma-separated)" value={form.skill_tags} onChange={(e) => setForm({ ...form, skill_tags: e.target.value })} />
          <button onClick={create} className="btn-primary sm:col-span-2">Create</button>
        </div>
      )}
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="card p-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{r.title}</div>
              <div className="text-xs text-text-faint">{r.type} · {r.category} · {r.is_published ? 'Published' : 'Hidden'}</div>
            </div>
            <div className="flex gap-2 ml-3">
              <a href={r.url} target="_blank" rel="noreferrer" className="btn-ghost text-xs px-2 py-1.5">View</a>
              <button onClick={() => onDelete(r.id)} className="btn-ghost text-error px-2 py-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

