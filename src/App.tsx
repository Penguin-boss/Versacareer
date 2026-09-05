import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './lib/authStore'
import React, { Suspense } from 'react'
const Landing = React.lazy(() => import('./pages/Landing'))
const Pricing = React.lazy(() => import('./pages/Pricing'))
const Privacy = React.lazy(() => import('./pages/Privacy'))
const Blog = React.lazy(() => import('./pages/Blog'))
const AuthPage = React.lazy(() => import('./pages/Auth'))
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'))
const Onboarding = React.lazy(() => import('./pages/Onboarding'))
import DashboardLayout, { FullLoader } from './components/DashboardLayout'
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Upload = React.lazy(() => import('./pages/Upload'))
const Analysis = React.lazy(() => import('./pages/Analysis'))
const CareerDNA = React.lazy(() => import('./pages/CareerDNA'))
const SkillGap = React.lazy(() => import('./pages/SkillGap'))
const Roadmap = React.lazy(() => import('./pages/Roadmap'))
const Mentor = React.lazy(() => import('./pages/Mentor'))
const Profile = React.lazy(() => import('./pages/Profile'))
const CareerGoals = React.lazy(() => import('./pages/CareerGoals'))
const Resources = React.lazy(() => import('./pages/Resources'))
const Billing = React.lazy(() => import('./pages/Billing'))
const Admin = React.lazy(() => import('./pages/Admin'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
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
    <Suspense fallback={<FullLoader />}>
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/blog" element={<Blog />} />
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
    </Suspense>
    </motion.div>
    </AnimatePresence>
  )
}
