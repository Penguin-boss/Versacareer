import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeOnly } from '../lib/motionVariants'
import { AmbientBackground } from '../components/AmbientBackground'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <AmbientBackground />
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/VersaCareer_AI_Logo.png" alt="VersaCareer AI" className="h-9 w-9 rounded-[2px]" />
            <div>
              <div className="font-semibold leading-tight">VersaCareer AI</div>
              <div className="text-[11px] text-text-faint">by Pragma</div>
            </div>
          </Link>
          <Link to="/dashboard" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      {/* Main Content */}
      <motion.section initial="hidden" animate="visible" variants={fadeOnly} className="max-w-4xl mx-auto px-4 md:px-8 pt-16 pb-20 relative z-10 text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: August 27, 2026</p>
        
        <div className="space-y-6 text-text-muted leading-relaxed">
          <p>Welcome to VersaCareer. VersaCareer is a career-development platform that helps students and learners analyze their resumes, identify skill gaps, develop relevant skills, improve their resumes, and practice for technical interviews through assessments such as DSA (Data Structures and Algorithms) questions.</p>
          <p>This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices you have regarding your information when you use VersaCareer.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">1. Information We Collect</h2>
          
          <h3 className="text-lg font-medium text-text mt-6 mb-2">1.1 Account Information</h3>
          <p>When you create or access a VersaCareer account, we may collect information such as:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Name</li>
            <li>Email address</li>
            <li>Profile information</li>
            <li>Profile picture, where provided</li>
            <li>Authentication information associated with your account</li>
          </ul>
          <p>You may sign in using third-party authentication providers such as Google, GitHub, or LinkedIn. When you use these services to sign in, we may receive information that the provider makes available to us according to your authorization and the provider's policies.</p>

          <h3 className="text-lg font-medium text-text mt-6 mb-2">1.2 Resume and Career Information</h3>
          <p>If you choose to use our resume-analysis features, you may provide:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Your resume or CV</li>
            <li>Education information</li>
            <li>Skills</li>
            <li>Work experience</li>
            <li>Projects</li>
            <li>Certifications</li>
            <li>Career interests</li>
            <li>Other information contained in your resume</li>
          </ul>
          <p>We use this information to provide resume analysis, identify potential skill gaps, and provide recommendations for improving your skills and resume.</p>

          <h3 className="text-lg font-medium text-text mt-6 mb-2">1.3 Assessment and Interview Information</h3>
          <p>When you participate in VersaCareer assessments or interview practice, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Questions presented to you</li>
            <li>Your answers and submissions</li>
            <li>Coding or DSA responses</li>
            <li>Assessment scores</li>
            <li>Feedback and evaluation results</li>
            <li>Skills demonstrated during assessments</li>
            <li>Progress and performance information</li>
          </ul>
          <p>This information is used to help you evaluate and improve your technical and interview skills.</p>

          <h3 className="text-lg font-medium text-text mt-6 mb-2">1.4 Usage Information</h3>
          <p>We may automatically collect limited technical and usage information when you use VersaCareer, such as:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Browser type</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Pages or features accessed</li>
            <li>General usage and interaction information</li>
            <li>Error and diagnostic information</li>
          </ul>
          <p>This information may be used to maintain security, troubleshoot problems, and improve the platform.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We may use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Create and maintain your VersaCareer account</li>
            <li>Authenticate you through supported sign-in providers</li>
            <li>Analyze your resume</li>
            <li>Identify potential skill gaps</li>
            <li>Recommend skills and learning areas</li>
            <li>Help you improve your resume</li>
            <li>Provide interview and DSA practice</li>
            <li>Evaluate assessment submissions</li>
            <li>Provide feedback on your performance</li>
            <li>Track your progress within the platform</li>
            <li>Improve and develop VersaCareer features</li>
            <li>Detect, prevent, and address security issues or misuse</li>
            <li>Communicate with you about your account or the service</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p>We use your information only for legitimate purposes related to providing, maintaining, improving, and securing VersaCareer.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">3. Third-Party Authentication</h2>
          <p>VersaCareer may allow you to sign in using services including:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Google</li>
            <li>GitHub</li>
            <li>LinkedIn</li>
          </ul>
          <p>If you choose a third-party login method, that provider may share certain information with VersaCareer as part of the authentication process. The information we receive depends on the provider, your settings, and the permissions associated with the authentication process. Your use of these third-party services is also subject to their respective privacy policies and terms.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">4. Resume and AI-Based Analysis</h2>
          <p>VersaCareer may use automated technologies, including AI-assisted tools, to analyze information you provide. These technologies may be used to:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Extract relevant information from resumes</li>
            <li>Identify skills</li>
            <li>Identify potential skill gaps</li>
            <li>Generate recommendations</li>
            <li>Provide resume improvement suggestions</li>
            <li>Assist with interview or assessment feedback</li>
          </ul>
          <p>Automated analysis is intended to provide educational and career-development assistance. Results and recommendations may not always be complete or accurate and should be reviewed using your own judgment.</p>
          <p>We do not guarantee that any recommendation, skill-gap analysis, assessment result, or resume suggestion will result in employment or a particular career outcome.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">5. How We Share Information</h2>
          <p>We do not sell your personal information.</p>
          <p>We may share information with service providers that help us operate VersaCareer, such as providers used for:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Authentication</li>
            <li>Database and data storage</li>
            <li>Hosting</li>
            <li>Application infrastructure</li>
            <li>AI or automated analysis</li>
            <li>Security and monitoring</li>
          </ul>
          <p>These providers may process information only as necessary to provide their services to us and are expected to handle information according to applicable contractual and legal requirements.</p>
          <p>We may also disclose information when reasonably necessary to:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Comply with applicable laws or legal processes</li>
            <li>Protect the rights, safety, and security of VersaCareer, our users, or others</li>
            <li>Detect or prevent fraud, abuse, or security threats</li>
            <li>Protect against misuse of the platform</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">6. Data Storage and Security</h2>
          <p>We take reasonable measures designed to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no internet-based service can guarantee complete security. You should avoid submitting highly sensitive personal information to your resume or other platform fields unless it is necessary for the service.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">7. Data Retention</h2>
          <p>We retain information for as long as reasonably necessary to provide VersaCareer's services, maintain your account, provide your assessment history, resolve disputes, enforce our agreements, and comply with applicable legal obligations.</p>
          <p>You may request deletion of your account and associated personal information by contacting us. Certain information may need to be retained for a limited period where required for legal, security, fraud-prevention, or legitimate operational purposes.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">8. Your Choices and Rights</h2>
          <p>Depending on applicable law, you may have rights regarding your personal information, including the ability to:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Request access to your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Request information about how your information is used</li>
            <li>Withdraw certain permissions where applicable</li>
            <li>Stop using the service and request account deletion</li>
          </ul>
          <p>To make a privacy-related request, contact us using the information provided below.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">9. Account Deletion</h2>
          <p>If you want to delete your VersaCareer account or request deletion of your personal information, contact us at:</p>
          <p>Email: sankeerthdevella@gmail.com</p>
          <p>Please include enough information for us to identify your account and process your request. We may retain limited information where required by law or reasonably necessary for legitimate security, fraud-prevention, or legal purposes.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">10. Cookies and Similar Technologies</h2>
          <p>VersaCareer may use cookies, local storage, session technologies, or similar mechanisms to:</p>
          <ul className="list-disc pl-5 space-y-1 ml-4">
            <li>Keep you signed in</li>
            <li>Maintain authentication sessions</li>
            <li>Remember preferences</li>
            <li>Improve functionality</li>
            <li>Maintain security</li>
            <li>Understand general platform usage</li>
          </ul>
          <p>You can manage cookies through your browser settings. Disabling certain technologies may affect some VersaCareer features.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">11. Children's and Student Users</h2>
          <p>VersaCareer is designed as an educational and career-development platform for students and learners. We do not knowingly collect personal information from children in violation of applicable laws. If you believe that a child has provided personal information to us without appropriate authorization or consent where required, please contact us so that we can review and take appropriate action. Parents or guardians who have concerns about a child's information may contact us using the contact information below.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">12. Third-Party Links</h2>
          <p>VersaCareer may contain links to external websites, services, or learning resources. We are not responsible for the privacy practices, security, or content of third-party websites. We encourage you to review the privacy policies of external services before providing them with personal information.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">13. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time as VersaCareer's features, services, or legal requirements change. When we make changes, we will update the "Last Updated" date at the top of this page. Your continued use of VersaCareer after an updated Privacy Policy becomes effective means that you acknowledge the updated policy, subject to applicable law.</p>

          <h2 className="text-xl font-semibold text-text mt-8 mb-4">14. Contact Us</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, contact us at:</p>
          <p>VersaCareer<br />
          Privacy Contact: <a href="mailto:sankeerthdevella@gmail.com" className="text-primary hover:underline">sankeerthdevella@gmail.com</a><br />
          Website: <a href="https://versacareer.vercel.app/" className="text-primary hover:underline">https://versacareer.vercel.app/</a></p>
          
          <p className="text-xs mt-8 italic border-t border-border pt-4">Note: This Privacy Policy is provided as general informational content and should be reviewed and adapted to your actual data practices and applicable legal requirements before publication.</p>
        </div>
      </motion.section>

      <footer className="border-t border-border relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center text-sm text-text-faint">
          VersaCareer is a product of Pragma, the AI SaaS wing of Optimus, founded by Vadlamudi Sai Chanakya and Devella Sankeerth.
        </div>
      </footer>
    </div>
  )
}
