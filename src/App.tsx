import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './lib/authStore'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import AuthPage from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import DashboardLayout, { FullLoader } from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'
import CareerDNA from './pages/CareerDNA'
import SkillGap from './pages/SkillGap'
import Roadmap from './pages/Roadmap'
import Mentor from './pages/Mentor'
import Profile from './pages/Profile'
import CareerGoals from './pages/CareerGoals'
import Resources from './pages/Resources'
import Billing from './pages/Billing'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import { usePageFade } from './lib/motionVariants'
import { ErrorBoundary } from './components/ErrorBoundary'

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading, profile } = useAuthStore()
  if (loading) return <FullLoader />
  if (!user) return <Navigate to="/" replace />
  // First login or missing career prefs -> onboarding (but allow skip)
  const needsOnboarding = profile && (!profile.experience_level || !profile.preferred_work_style || !(profile.target_roles && profile.target_roles.length > 0))
  if (needsOnboarding && window.location.pathname !== '/onboarding' && !sessionStorage.getItem('onboarded')) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading, profile } = useAuthStore()
  if (loading) return <FullLoader />
  if (!user) return <Navigate to="/" replace />
  if (profile?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuthStore()
  const location = useLocation()
  const pageFade = usePageFade()

  return (
    <AnimatePresence mode="wait">
    <motion.div key={location.pathname} initial={pageFade.initial} animate={pageFade.animate} exit={pageFade.exit}>
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
      <Route element={<Protected><DashboardLayout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/career-goals" element={<CareerGoals />} />
        <Route path="/analysis" element={<ErrorBoundary inline fallbackMessage="Couldn't display this analysis — try again"><Analysis /></ErrorBoundary>} />
        <Route path="/career-dna" element={<CareerDNA />} />
        <Route path="/skill-gap" element={<SkillGap />} />
        <Route path="/roadmap" element={<ErrorBoundary inline fallbackMessage="Couldn't display your roadmap — try again"><Roadmap /></ErrorBoundary>} />
        <Route path="/mentor" element={<ErrorBoundary inline fallbackMessage="Couldn't load the mentor chat — try again"><Mentor /></ErrorBoundary>} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/billing" element={<Billing />} />
      </Route>
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </motion.div>
    </AnimatePresence>
  )
}
