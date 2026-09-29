import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { AmbientBackground } from '../components/AmbientBackground'

const blogPosts = [
  {
    slug: 'resume-ats-formatting',
    title: 'How to Format Your Resume for ATS: Complete 2026 Guide',
    description: 'Learn the secrets to getting past Applicant Tracking Systems and landing interviews. Covers formatting, keywords, file types, and common mistakes.',
    date: '2026-09-10',
    author: 'VersaCareer Team',
    category: 'Resume Writing',
    readTime: '8 min read',
    image: '/assets/brand/og-card.webp'
  },
  {
    slug: 'top-technical-skills-2026',
    title: 'Top 5 Technical Skills in 2026: What Employers Actually Want',
    description: 'See which skills are trending and how to quickly close your knowledge gaps. Based on analysis of 10,000+ job postings.',
    date: '2026-09-05',
    author: 'VersaCareer Team',
    category: 'Career Trends',
    readTime: '6 min read',
    image: '/assets/brand/og-card.webp'
  },
  {
    slug: 'skill-gap-analysis-guide',
    title: 'Skill Gap Analysis: How to Identify and Close Your Career Gaps',
    description: 'A step-by-step guide to conducting a personal skill gap analysis, prioritizing learning, and building a roadmap to your target role.',
    date: '2026-08-28',
    author: 'VersaCareer Team',
    category: 'Career Development',
    readTime: '10 min read',
    image: '/assets/brand/og-card.webp'
  },
  {
    slug: 'mock-interview-preparation',
    title: 'Mock Interview Preparation: Practice Like a Pro, Perform Like a Star',
    description: 'Everything you need to know about mock interviews: types, platforms, common questions, and how to use AI feedback to improve.',
    date: '2026-08-20',
    author: 'VersaCareer Team',
    category: 'Interview Prep',
    readTime: '7 min read',
    image: '/assets/brand/og-card.webp'
  },
  {
    slug: 'career-roadmap-planning',
    title: 'Building a Career Roadmap: From Where You Are to Where You Want to Be',
    description: 'Learn how to create a personalized week-by-week career roadmap that turns skill gaps into achievable milestones.',
    date: '2026-08-15',
    author: 'VersaCareer Team',
    category: 'Career Planning',
    readTime: '9 min read',
    image: '/assets/brand/og-card.webp'
  },
  {
    slug: 'resume-action-verbs',
    title: '100+ Powerful Resume Action Verbs to Replace Weak Phrases',
    description: 'Replace passive language with strong action verbs. Categorized by skill type with before/after examples for instant resume improvement.',
    date: '2026-08-10',
    author: 'VersaCareer Team',
    category: 'Resume Writing',
    readTime: '5 min read',
    image: '/assets/brand/og-card.webp'
  }
]

export default function Blog() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "VersaCareer Career Resources",
    "description": "Expert guides on resume writing, skill gap analysis, interview preparation, and career planning from the VersaCareer team.",
    "url": "https://versacareer.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "VersaCareer",
      "logo": {
        "@type": "ImageObject",
        "url": "https://versacareer.com/assets/brand/icon-512.webp"
      }
    },
    "blogPosts": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.description,
      "url": `https://versacareer.com/blog/${post.slug}`,
      "datePublished": post.date,
      "dateModified": post.date,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "VersaCareer"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://versacareer.com/blog/${post.slug}`
      },
      "image": `https://versacareer.com${post.image}`,
      "articleSection": post.category,
      "keywords": post.category,
      "timeRequired": `PT${post.readTime.split(' ')[0]}M`
    }))
  }

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Helmet>
        <title>Blog & Career Resources — VersaCareer | Resume, Interview & Career Guides</title>
        <meta name="description" content="Expert guides on resume writing, ATS optimization, skill gap analysis, mock interview prep, and career roadmap planning. Free resources to accelerate your career." />
        <meta name="keywords" content="resume writing tips, ATS optimization, skill gap analysis, interview preparation, career roadmap, career development guides" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://versacareer.com/blog" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://versacareer.com/blog" />
        <meta property="og:title" content="Blog & Career Resources — VersaCareer" />
        <meta property="og:description" content="Expert guides on resume writing, skill gaps, interview prep, and career planning. Free resources to accelerate your career." />
        <meta property="og:image" content="https://versacareer.com/assets/brand/og-card.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="VersaCareer" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://versacareer.com/blog" />
        <meta name="twitter:title" content="Blog & Career Resources — VersaCareer" />
        <meta name="twitter:description" content="Expert guides on resume writing, skill gaps, interview prep, and career planning. Free resources to accelerate your career." />
        <meta name="twitter:image" content="https://versacareer.com/assets/brand/og-card.webp" />
        <meta name="twitter:site" content="@versacareer" />
        
        {/* JSON-LD Blog Schema */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://versacareer.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://versacareer.com/blog"
              }
            ]
          })}
        </script>
      </Helmet>
      <AmbientBackground />
      <header className="border-b border-border relative z-10 bg-bg/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-text">VersaCareer</Link>
          <div className="flex gap-4">
            <Link to="/auth?mode=signin" className="text-text-muted hover:text-text transition-colors">Sign in</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 relative z-10">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-text-muted">
            <li><Link to="/" className="hover:text-text">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Blog</li>
          </ol>
        </nav>
        
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Career Resources</h1>
          <p className="text-text-muted text-lg">Expert guides to help you write better resumes, ace interviews, and plan your career path.</p>
        </header>
        
        <div className="grid gap-6">
          {blogPosts.map((post) => (
            <article 
              key={post.slug} 
              className="p-6 border border-border rounded-xl bg-surface-1 hover:border-primary/30 transition-colors"
              itemScope
              itemType="https://schema.org/BlogPosting"
            >
              <meta itemProp="url" content={`https://versacareer.com/blog/${post.slug}`} />
              <meta itemProp="datePublished" content={post.date} />
              <meta itemProp="author" content={post.author} />
              <meta itemProp="articleSection" content={post.category} />
              
              <div className="flex items-center gap-3 mb-3">
                <span className="badge bg-primary-soft text-primary border border-primary/20">{post.category}</span>
                <time dateTime={post.date} className="text-xs text-text-faint" itemProp="datePublished">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
                <span className="text-xs text-text-faint" itemProp="timeRequired">{post.readTime}</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2" itemProp="headline">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-text-muted mb-4" itemProp="description">{post.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary text-sm font-medium" itemProp="author">
                  {post.author}
                </span>
                <Link to={`/blog/${post.slug}`} className="btn-secondary text-sm">
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
        
        {/* Newsletter Signup */}
        <section className="mt-16 p-8 rounded-xl bg-primary-soft border border-primary/20 text-center">
          <h3 className="text-xl font-semibold mb-2">Get career tips delivered weekly</h3>
          <p className="text-text-muted mb-6 max-w-md mx-auto">Join 5,000+ professionals getting actionable career advice every Tuesday.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="input flex-1"
              aria-label="Email address"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Subscribe</button>
          </form>
          <p className="text-xs text-text-faint mt-3">No spam. Unsubscribe anytime. <Link to="/privacy" className="underline hover:text-text">Privacy Policy</Link></p>
        </section>
      </main>
    </div>
  )
}