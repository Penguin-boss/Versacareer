import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://versacareer.com'
const IMAGE_URL = `${SITE_URL}/assets/brand/og-card.webp`

type Meta = { title: string; description: string; indexable: boolean }

const PUBLIC_META: Record<string, Meta> = {
  '/': {
    title: 'VersaCareer — AI Career Intelligence Platform',
    description: 'Analyze your resume with AI, find skill gaps, build a personalized career roadmap, and practice mock interviews with VersaCareer.',
    indexable: true,
  },
  '/pricing': {
    title: 'Pricing — VersaCareer AI Career Intelligence',
    description: 'Choose a VersaCareer plan for AI resume analysis, career roadmaps, skill-gap insights, and mentor support.',
    indexable: true,
  },
  '/privacy': {
    title: 'Privacy Policy — VersaCareer',
    description: 'Learn how VersaCareer handles account, resume, and career data.',
    indexable: true,
  },
  '/blog': {
    title: 'Career Insights & Advice — VersaCareer Blog',
    description: 'Practical advice for resumes, interviews, skills, and career growth from VersaCareer.',
    indexable: true,
  },
  '/auth': {
    title: 'Sign in or create an account — VersaCareer',
    description: 'Sign in to VersaCareer or create a free account to start your career intelligence journey.',
    indexable: false,
  },
}

const PRIVATE_ROUTES = new Set([
  '/dashboard', '/upload', '/analysis', '/career-dna', '/skill-gap', '/roadmap',
  '/mentor', '/resources', '/profile', '/billing', '/career-goals', '/onboarding',
  '/admin', '/auth/callback',
])

export function RouteMeta() {
  const { pathname } = useLocation()
  const meta = PUBLIC_META[pathname] ?? {
    title: pathname === '/404' ? 'Page not found — VersaCareer' : 'VersaCareer AI Career Intelligence',
    description: 'VersaCareer helps you understand your skills, improve your resume, and plan your next career move.',
    indexable: false,
  }
  const indexable = meta.indexable && !PRIVATE_ROUTES.has(pathname)
  const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`

  const structuredData = pathname === '/' ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VersaCareer',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: meta.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  } : null

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={IMAGE_URL} />
      <meta property="og:image:alt" content="VersaCareer AI Career Intelligence Platform" />
      <meta property="og:site_name" content="VersaCareer" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={IMAGE_URL} />
      {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  )
}
