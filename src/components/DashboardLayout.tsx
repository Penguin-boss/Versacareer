import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAuthStore } from '../lib/authStore'
import FeedbackWidget from './FeedbackWidget'
import { ThemeToggle } from './ThemeToggle'
import {
  LayoutDashboard, FileText, Dna, Target, Map, MessageSquare,
  User, LogOut, Sparkles, BookOpen, Shield, Crown,
} from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Resume Analyzer', icon: FileText },
  { to: '/career-dna', label: 'Career DNA', icon: Dna },
  { to: '/skill-gap', label: 'Skill Gap', icon: Target },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/mentor', label: 'AI Mentor', icon: MessageSquare },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/career-goals', label: 'Career Goals', icon: Target },
  { to: '/profile', label: 'Profile', icon: User },
]

export function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <img src="/assets/brand/icon-gold.png" alt="VersaCareer AI" className="h-16 w-16 object-contain animate-brand-fade" />
        <p className="text-text-muted text-sm font-mono">Loading VersaCareer AI…</p>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const { signOut } = useAuth()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'ADMIN'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-bg-soft">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <Link to="/" aria-label="VersaCareer AI home" className="inline-flex items-center">
            <img src="/assets/brand/VersaCareer_AI_Logo_Gold_OnDark.png" alt="VersaCareer AI" className="h-9 w-auto max-w-full object-contain" />
          </Link>
          <ThemeToggle className="scale-90 opacity-75 hover:opacity-100" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm transition-colors duration-150 ${
                  isActive ? 'bg-primary-soft text-primary border-l-2 border-primary' : 'text-text-muted hover:text-text hover:bg-bg-elev border-l-2 border-transparent'
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-wider text-text-faint font-mono">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isActive ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-text-muted hover:text-text hover:bg-bg-elev border-l-2 border-transparent'
                  }`
                }
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          {profile?.plan === 'FREE' && (
            <button onClick={() => navigate('/billing')} className="btn-secondary w-full mb-2 text-xs justify-center">
              <Crown className="h-3.5 w-3.5 text-warning" /> Upgrade to Pro
            </button>
          )}
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-9 w-9 rounded-[2px] bg-primary-soft text-primary flex items-center justify-center text-sm font-semibold">
              {profile?.name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">{profile?.name ?? 'User'}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-text-faint truncate font-mono">{profile?.email}</span>
              </div>
            </div>
            <span className={`badge ${profile?.plan === 'PRO' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-bg-elev text-text-muted'}`}>
              {profile?.plan ?? 'FREE'}
            </span>
          </div>
          {/* Sign out: clears the current session. auth.tsx will immediately create a
              new anonymous session on the next page load, since there is no login screen.
              To restore a real sign-out-to-login flow, re-add the /auth route in App.tsx. */}
          <button onClick={handleSignOut} className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-border bg-bg-soft px-4 py-3">
          <Link to="/" aria-label="VersaCareer home" className="inline-flex items-center">
            <img src="/assets/brand/VersaCareer_AI_Icon_Gold.png" alt="VersaCareer" className="h-7 w-7 object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="scale-90" />
            {profile?.plan === 'FREE' && (
              <button onClick={() => navigate('/billing')} className="btn-ghost px-2 py-1.5 text-xs" aria-label="Upgrade to Pro">
                <Crown className="h-3.5 w-3.5 text-warning" />
              </button>
            )}
            <button onClick={handleSignOut} className="btn-ghost px-2 py-1.5" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav scroll */}
        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border bg-bg-soft">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-xs whitespace-nowrap ${
                  isActive ? 'bg-primary-soft text-primary' : 'text-text-muted'
                }`
              }
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-xs whitespace-nowrap ${
                isActive ? 'bg-primary/10 text-primary' : 'text-text-muted'
              }`
            }>
              <Shield className="h-3.5 w-3.5" /> Admin
            </NavLink>
          )}
        </nav>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <FeedbackWidget />
    </div>
  )
}

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
      </div>
      {subtitle && <p className="text-text-muted text-sm">{subtitle}</p>}
    </div>
  )
}

export function SparkleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge bg-primary-soft text-primary border border-primary/20">
      <Sparkles className="h-3 w-3 mr-1" />{children}
    </span>
  )
}

export function ProBadge() {
  return (
    <span className="badge bg-warning/10 text-warning border border-warning/20">
      <Crown className="h-3 w-3 mr-1" /> PRO
    </span>
  )
}

