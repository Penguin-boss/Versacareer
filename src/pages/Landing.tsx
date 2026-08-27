import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Dna, Target, Map, MessageSquare, ArrowRight, Lock, Server, Shield, CircleCheck as CheckCircle2 } from 'lucide-react'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

import { ThemeToggle } from '../components/ThemeToggle'

const features = [
  { icon: FileText, title: 'AI Resume Analyzer', desc: 'Upload your resume and get ATS, technical, market, and project scores with actionable suggestions.' },
  { icon: Dna, title: 'Career DNA', desc: 'A short assessment that reveals your interests, strengths, and suggested career paths.' },
  { icon: Target, title: 'Skill Gap Analysis', desc: 'See exactly which skills you are missing for your target role, prioritized by impact.' },
  { icon: Map, title: 'Personalized Roadmap', desc: 'A week-by-week plan to close your gaps, with progress that syncs across devices.' },
  { icon: MessageSquare, title: 'AI Career Mentor', desc: 'Chat with an AI mentor that knows your scores, skills, and gaps — gives direct, practical advice.' },
]

function AnnotatedResume() {
  const scores = [
    { label: 'ATS', value: 78, color: 'text-primary' },
    { label: 'TECH', value: 65, color: 'text-primary' },
    { label: 'MKT', value: 82, color: 'text-primary' },
    { label: 'PROJ', value: 71, color: 'text-primary' },
  ]

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Resume paper */}
      <div className="relative bg-[#f5f1e8] text-[#0A0E14] rounded-[3px] shadow-2xl p-7 pb-10 transform rotate-[-1.5deg] transition-transform duration-500 hover:rotate-0">
        {/* Paper texture lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-t-[3px]" />

        {/* Header */}
        <div className="border-b border-[#d4cdb8] pb-3 mb-4">
          <div className="font-display text-lg font-semibold text-[#0A0E14]">Jane Doe</div>
          <div className="text-[10px] text-[#6b6558] font-mono mt-0.5">Senior Frontend Engineer · San Francisco</div>
        </div>

        {/* Experience lines */}
        <div className="space-y-2.5">
          <div>
            <div className="h-2 w-3/5 bg-[#d4cdb8] rounded-[1px]" />
            <div className="h-1.5 w-full bg-[#e0d9c6] rounded-[1px] mt-1.5" />
            <div className="h-1.5 w-4/5 bg-[#e0d9c6] rounded-[1px] mt-1" />
          </div>
          <div className="pt-1">
            <div className="h-2 w-2/5 bg-[#d4cdb8] rounded-[1px]" />
            <div className="h-1.5 w-full bg-[#e0d9c6] rounded-[1px] mt-1.5" />
            <div className="h-1.5 w-3/4 bg-[#e0d9c6] rounded-[1px] mt-1" />
          </div>
          <div className="pt-1">
            <div className="h-2 w-1/2 bg-[#d4cdb8] rounded-[1px]" />
            <div className="h-1.5 w-full bg-[#e0d9c6] rounded-[1px] mt-1.5" />
          </div>
        </div>

        {/* Annotation marks - red pencil style */}
        <div className="absolute top-[52px] right-3 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-error font-semibold">weak verb</span>
            <div className="w-4 h-0.5 bg-error" />
          </div>
        </div>
        <div className="absolute top-[100px] right-3 flex items-center gap-1">
          <span className="text-[9px] font-mono text-error font-semibold">add metrics</span>
          <div className="w-3 h-0.5 bg-error" />
        </div>

        {/* Circled keyword */}
        <div className="absolute top-[145px] left-6">
          <div className="absolute -inset-1 border-2 border-primary rounded-full opacity-70" />
          <div className="h-2 w-16 bg-[#d4cdb8] rounded-[1px] relative" />
        </div>
      </div>

      {/* Score badges floating around resume */}
      <div className="absolute -top-4 -right-4 flex flex-col gap-2">
        {scores.slice(0, 2).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-2 bg-bg-card border border-border rounded-[2px] px-3 py-2 shadow-card"
          >
            <span className="text-[10px] font-mono text-text-faint">{s.label}</span>
            <span className={`text-lg font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>
      <div className="absolute -bottom-2 -left-4 flex flex-col gap-2">
        {scores.slice(2).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 bg-bg-card border border-border rounded-[2px] px-3 py-2 shadow-card"
          >
            <span className="text-[10px] font-mono text-text-faint">{s.label}</span>
            <span className={`text-lg font-display font-bold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Margin note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute -bottom-12 right-8 flex items-start gap-1.5"
      >
        <div className="w-0.5 h-8 bg-primary/40" />
        <div className="text-[10px] font-mono text-primary/80 leading-tight max-w-[120px]">
          Overall readiness<br />improved 23% after<br />3 iterations
        </div>
      </motion.div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 70% 30%, rgba(46,94,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(46,94,255,0.04) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Nav */}
      <header className="border-b border-border relative z-10 bg-bg/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="VersaCareer AI home" className="inline-flex items-center">
            <img src="/assets/brand/VersaCareer_AI_Logo_Gold_OnDark.png" alt="VersaCareer AI" className="h-9 w-auto max-w-[220px] object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth?mode=signin" className="btn-ghost text-sm hidden sm:inline-flex">Sign in</Link>
            <Link to="/auth?mode=signup" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <motion.img
              src="/assets/brand/VersaCareer_AI_Logo_Gold_OnDark.png"
              alt="VersaCareer AI"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-20 w-auto max-w-full object-contain mb-7"
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-[2px] border border-border bg-bg-soft px-3 py-1 text-xs text-text-muted mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
              <span className="font-mono">CAREER INTELLIGENCE PLATFORM</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-5 leading-[1.1]"
            >
              Don't find a job.<br />
              <span className="text-primary">Become the person companies want to hire.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-text-muted text-lg max-w-lg mb-8 leading-relaxed"
            >
              VersaCareer analyzes your resume, maps your skill gaps, builds a personalized roadmap, and mentors you — so you always know where you stand and what to do next.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <Link to="/auth?mode=signup" className="btn-primary text-base px-6 py-3">Get started free <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/pricing" className="btn-secondary text-base px-6 py-3">See pricing</Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 mt-6 text-xs text-text-faint"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> 3 free analyses</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> 20 mentor messages</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> No credit card</span>
            </motion.div>
          </div>

          {/* Right: annotated resume visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            <AnnotatedResume />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <motion.section
        id="features"
        className="max-w-6xl mx-auto px-4 md:px-8 py-16 border-t border-border relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer(70)}
      >
        <motion.div variants={fadeSlideUp} className="mb-12">
          <h2 className="text-3xl font-display font-semibold mb-3">Everything you need to become job-ready</h2>
          <p className="text-text-muted">Six modules. One goal. Know exactly where you stand.</p>
        </motion.div>
        <motion.div variants={staggerContainer(60)} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeSlideUp}
              className="card card-hover p-6 group"
            >
              <div className="h-11 w-11 rounded-[2px] bg-primary-soft text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-medium text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Trust / architecture */}
      <motion.section
        className="max-w-6xl mx-auto px-4 md:px-8 py-16 border-t border-border relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer(60)}
      >
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: 'No exposed API keys', desc: 'Every AI call runs server-side. Your data and our keys never reach the browser.' },
            { icon: Server, title: 'Real backend, real database', desc: 'Postgres-backed. Your scores, history, and progress survive across devices and reloads.' },
            { icon: Shield, title: 'Server-enforced limits', desc: 'Free-tier caps are checked on the server against your authenticated account — not a client counter.' },
          ].map((t) => (
            <motion.div key={t.title} variants={fadeSlideUp} className="flex gap-3">
              <div className="h-10 w-10 rounded-[2px] bg-bg-elev flex items-center justify-center flex-shrink-0">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-medium text-sm mb-1">{t.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center border-t border-border relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeOnly}
      >
        <h2 className="text-3xl font-display font-semibold mb-4">Start with your first resume analysis</h2>
        <p className="text-text-muted mb-8">Free. Takes two minutes. No credit card.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/auth?mode=signup" className="btn-primary text-base px-6 py-3 inline-flex">
            No existing account? Create one <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth?mode=signin" className="text-primary hover:underline font-medium text-sm">
            Already have an account? Sign in
          </Link>
        </div>
      </motion.section>

      <footer className="border-t border-border relative z-10 bg-[#0A0A08]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col items-center gap-4 text-center text-sm text-text-faint">
          <img src="/assets/brand/VersaCareer_AI_Logo_Gold_OnDark.png" alt="VersaCareer" className="h-8 w-auto max-w-[200px] object-contain" />
          <p>VersaCareer is a product of Pragma, the AI SaaS wing of Optimus, founded by Vadlamudi Sai Chanakya and Devella Sankeerth.</p>
        </div>
      </footer>
    </div>
  )
}

