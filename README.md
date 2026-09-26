# VersaCareer — AI-Powered Career Intelligence Platform

VersaCareer is a comprehensive career development platform that combines AI-driven resume analysis, skill gap assessment, career discovery, and personalized roadmaps to help professionals and students accelerate their career growth. Built with modern web technologies and hosted on Vercel, it delivers real-time insights and actionable guidance to bridge the gap between where you are and where you want to be.

**Live Demo:** [https://versacareer.vercel.app](https://versacareer.vercel.app)

---

## Features

### Core Capabilities

- **Resume Analysis Engine**  
  Upload and analyze resumes with AI-powered scoring across multiple dimensions: ATS compatibility, technical depth, experience articulation, and project showcase quality. Get detailed feedback with actionable suggestions.

- **Career DNA Assessment**  
  Take a 21-question Career DNA quiz that evaluates seven core dimensions (Analytical, Creative, Systems Thinking, Communication, Structure, Security/Risk, Ownership). Receive personalized career matches based on your unique strengths and work style.

- **Skill Gap Analysis**  
  Identify missing skills for your target roles. Compare your current skill set against industry requirements and get a curated roadmap to close knowledge gaps.

- **Personalized Learning Roadmap**  
  Generate AI-powered 12-week milestones tailored to your career goals. Track progress and unlock structured recommendations as you advance through your journey.

- **Career Mentor Chat**  
  Engage with an AI career coach for one-on-one guidance on interview prep, salary negotiation, role transitions, and career strategy. Context-aware responses based on your profile and history.

- **Resource Library**  
  Curated collection of courses, books, YouTube tutorials, GitHub projects, and learning roadmaps aligned with your skill gaps and target roles.

- **Job Readiness Tracking**  
  Monitor your overall readiness across multiple dimensions: resume quality, skill coverage, interview prep, and career goal progress. Pro users get trend charts over time.

- **Resume Builder**  
  Craft professional resumes from scratch or improve existing ones with templates, structured sections (contact, summary, experience, education, skills, projects, certifications), and AI-assisted section generation.

---

## Stack

### Frontend & Runtime
- **Framework:** React 18 + TypeScript (76.1% of codebase)  
- **Build Tool:** Vite 5  
- **Styling:** Tailwind CSS 3 + custom CSS (11.9% of codebase)  
- **UI/Motion:** Framer Motion, React Router DOM, Lucide Icons  
- **3D Visualization:** Three.js + React Three Fiber (interactive career path visualizations)  
- **State Management:** Zustand  
- **Forms & Validation:** React Hook Form integration  
- **Data Visualization:** Recharts (trend charts, skill gap visuals)  
- **Notifications:** React Hot Toast  
- **SEO:** React Helmet Async  

### Backend & Infrastructure
- **Auth & Database:** Supabase (PostgreSQL)  
- **AI Services:** Google Gemini, Anthropic Claude  
- **Hosting:** Vercel  
- **Storage:** Supabase Storage (resume uploads)  
- **Payments:** Stripe (PRO, PRO_PLUS, FOUNDER tiers)  

### Database Design
- **Language:** PLpgSQL (10.9% of codebase)  
- **Architecture:** Multi-tenant with Row-Level Security (RLS)  
- **Core Tables:**
  - `profiles` — user accounts, subscription plans, career preferences  
  - `resume_analyses` — AI-scored analyses with structured feedback  
  - `career_dna` — latest assessment results  
  - `career_dna_history` — assessment history for comparisons  
  - `milestones` — personalized roadmap progression  
  - `chat_messages` — mentor conversation history  
  - `resumes` — saved resume drafts from builder  
  - `resources` — admin-managed learning library  
  - `ai_usage_logs` — cost tracking and audit logs  
  - `job_readiness_history` — trend snapshots for Pro analytics  
  - `usage_counters` — free-tier enforcement (analyses, chat, resume generations)  

---

## How It's Organized

```
src/
  pages/              Landing, Pricing, Auth, Dashboard, Analysis, 
                      CareerDNA, SkillGap, Roadmap, Mentor, Profile, 
                      Resources, Billing, Admin, Upload, CareerGoals, Blog, Privacy
  components/         UI: DashboardLayout, ErrorBoundary, AmbientBackground,
                      Navbar, Cards, Forms, Charts, Loaders
  lib/                authStore (Zustand), auth (AuthProvider), supabase client,
                      types (TypeScript interfaces), careerDnaQuestions,
                      motionVariants, useCountUp, useTheme, useReducedMotion
  index.css           Tailwind globals, design tokens (colors, fonts, shadows)

public/               Logos, icons, brand assets (dark/light/transparent variants),
                      favicon, OG cards, manifest

supabase/             Edge functions, RLS policies, schema migrations (all_migrations_qeditor.sql)

index.html            Vite entry, theme persistence, SEO meta tags
tailwind.config.js    Custom color palette, typography, animations
vite.config.ts        Vite + React plugin, build target ES2019
vercel.json           Vercel deployment config
```

### Data Flow
1. **Authentication** — Supabase Auth (email/OAuth) → `profiles` table → Zustand `useAuthStore`  
2. **Resume Upload** — User uploads PDF → Supabase Storage → backend parses text → Gemini API scores resume → results stored in `resume_analyses`  
3. **Career DNA** — Answers submitted → 21 answers mapped to 7-axis vector → stored in `career_dna` + `career_dna_history` → matches cached  
4. **Mentor Chat** — User message → Claude/Gemini retrieves user context (profile, analyses, career goals) → generates response → stored in `chat_messages`  
5. **Roadmap Generation** — Target role + skill gaps → Gemini generates 12-week milestones → stored in `milestones` table  
6. **Billing** — Stripe webhook → updates `profiles.plan`, `billing_cycle`, `plan_renews_at` → feature gating by plan  

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn  
- Supabase project (create free at [supabase.com](https://supabase.com))  
- Google Gemini API key (free tier available)  
- Stripe account (for billing features)  

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Penguin-boss/Versacareer.git
   cd Versacareer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env.local` file in the root:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   VITE_STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLIC_KEY
   ```

4. **Initialize Supabase**  
   Apply migrations:
   ```bash
   # Use the Supabase dashboard or psql to run all_migrations_qeditor.sql
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5173`

6. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with live reload |
| `npm run build` | TypeScript check + Vite build + React Snap pre-render |
| `npm run lint` | ESLint check (max 0 warnings) |
| `npm run preview` | Preview production build locally |

---

## Usage

### For Users

1. **Sign up / Sign in**  
   Create an account via email or OAuth (GitHub, Google, etc.)

2. **Complete onboarding**  
   Set experience level, preferred work style, and target roles

3. **Upload resume**  
   → Get instant AI analysis with scores and recommendations

4. **Take Career DNA**  
   → Discover your career profile and top matching roles

5. **Generate skill gaps**  
   → Compare current skills vs. target role requirements

6. **Build your roadmap**  
   → Get a 12-week personalized learning plan

7. **Chat with mentor**  
   → Get one-on-one career guidance

8. **Explore resources**  
   → Curated courses, books, projects matching your needs

9. **Track job readiness**  
   → See your progress across multiple dimensions (Pro feature)

### For Admins

- **Manage resources**  
  Add/edit/publish learning resources to the library

- **View analytics**  
  Monitor user registrations, feature usage, AI costs

- **Feature flags**  
  Toggle features on/off globally via the database

---

## Deployment

VersaCareer is deployed on **Vercel** with automatic deployments from the `main` branch.

### Deploy Steps

1. Push to `main`
2. Vercel CI/CD pipeline:
   - Runs `npm run build` → TypeScript + Vite build  
   - Skips React Snap (Chrome unavailable) → logs to console  
   - Deploys to production  
3. Live at `https://versacareer.vercel.app`

### Environment Variables (Vercel)
Add the same `.env.local` variables to Vercel project settings under **Settings → Environment Variables**.

---

## Pricing & Plans

- **FREE** (3 analyses/month, 20 chat messages/month, 10 resume generations/month)
- **PRO** ($9.99/mo or $99.99/yr) — unlimited analyses, chat, generations + job readiness tracking
- **PRO_PLUS** ($19.99/mo or $199.99/yr) — all PRO + priority support + advanced analytics
- **FOUNDER** (one-time $49) — lifetime access at PRO_PLUS level (limited qty)

Billing managed via Stripe webhooks → Supabase `profiles` table.

---

## Architecture Highlights

### Security
- **Row-Level Security (RLS)** on all user-scoped tables — every SELECT/INSERT/UPDATE/DELETE is scoped to `auth.uid()`  
- **OAuth & email auth** via Supabase Auth  
- **No personal data in logs** — AI usage logged separately without sensitive content  
- **API keys** stored in Supabase secrets, not client-side  

### Performance
- **Lazy-loaded routes** — React.lazy() with Suspense for fast initial load  
- **Vite build optimization** — tree-shaking, code splitting, minification  
- **Tailwind JIT** — only styles for used utilities compiled  
- **Recharts + Three.js** — efficient rendering with requestAnimationFrame  
- **Vercel edge caching** — automatic cache headers on Vercel  

### Observability
- **Error boundary** — catches and logs React component crashes  
- **Toast notifications** — user-facing error & success feedback  
- **AI usage logging** — tracks tokens, estimated costs per feature  
- **Stripe webhooks** — audit trail for billing events  

---

## Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m "Add amazing feature"`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

**Code style:**  
- ESLint + Prettier enforced  
- TypeScript strict mode  
- React best practices (hooks, composition, error boundaries)  

---

## Roadmap

- [ ] Mobile app (React Native)  
- [ ] LinkedIn resume import  
- [ ] Real-time interview prep with video feedback  
- [ ] Salary negotiation guide  
- [ ] Team/organization workspace  
- [ ] Job match alerts  
- [ ] Advanced analytics dashboard  

---

## License

This project is proprietary software. See the LICENSE file for details (if applicable).

---

## Support & Contact

- **Website:** [https://versacareer.vercel.app](https://versacareer.vercel.app)  
- **Email:** support@versacareer.com  
- **Issues:** [GitHub Issues](https://github.com/Penguin-boss/Versacareer/issues)  
- **Discussions:** [GitHub Discussions](https://github.com/Penguin-boss/Versacareer/discussions)  

---

## Acknowledgments

- **Supabase** — PostgreSQL, Auth, Storage, Realtime  
- **Google Gemini** — AI-powered resume analysis & career guidance  
- **Anthropic Claude** — alternative AI backbone  
- **Vercel** — hosting & deployment  
- **Tailwind CSS** — rapid UI development  
- **Framer Motion** — smooth animations  

---

**Made with ❤️ by the Pragma team**  
_Analyze. Upskill. Succeed._
