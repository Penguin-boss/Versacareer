// Career DNA Question Bank — 21 scenario-based, multiple-choice questions
// Axes: AN=Analytical, CR=Creative, SY=Systems Thinking, CO=Communication,
//        ST=Structure/Process, SE=Security/Risk, OW=Ownership/Product

export type AxisKey = 'AN' | 'CR' | 'SY' | 'CO' | 'ST' | 'SE' | 'OW'

export const AXIS_LABELS: Record<AxisKey, string> = {
  AN: 'Analytical',
  CR: 'Creative',
  SY: 'Systems',
  CO: 'Communication',
  ST: 'Structure',
  SE: 'Security',
  OW: 'Ownership',
}

export const AXIS_ORDER: AxisKey[] = ['AN', 'CR', 'SY', 'CO', 'ST', 'SE', 'OW']

export interface CareerDNAOption {
  label: string
  axis: AxisKey
}

export interface CareerDNAQuestion {
  id: string
  prompt: string
  options: CareerDNAOption[]
}

export const QUESTIONS: CareerDNAQuestion[] = [
  {
    id: 'q1',
    prompt: "A project just shipped with a small bug still open. What's your instinct?",
    options: [
      { label: 'Trace exactly why it happened before touching anything else', axis: 'AN' },
      { label: 'Check whether it could be exploited or misused first', axis: 'SE' },
      { label: "Decide if it's worth delaying the next release for", axis: 'OW' },
      { label: "Note it and move on — momentum matters more right now", axis: 'ST' },
    ],
  },
  {
    id: 'q2',
    prompt: "You're handed a messy, half-finished project. First move?",
    options: [
      { label: 'Map out how all the existing pieces connect', axis: 'SY' },
      { label: 'Redesign the parts that feel clunky', axis: 'CR' },
      { label: 'Write a checklist to bring order to it', axis: 'ST' },
      { label: "Ask the people who'll use it what's actually missing", axis: 'CO' },
    ],
  },
  {
    id: 'q3',
    prompt: 'Which compliment would you rather receive about your work?',
    options: [
      { label: "That's a clever solution", axis: 'AN' },
      { label: "That's beautiful", axis: 'CR' },
      { label: "That's exactly what we needed", axis: 'OW' },
      { label: "That's rock solid, nothing's going to break it", axis: 'SE' },
    ],
  },
  {
    id: 'q4',
    prompt: "A teammate asks for help. What do you naturally offer?",
    options: [
      { label: 'Walk through the logic with them step by step', axis: 'AN' },
      { label: 'Show them a faster, more reliable process', axis: 'ST' },
      { label: "Explain it in a way that makes it click for them", axis: 'CO' },
      { label: "Ask what they're really trying to achieve first", axis: 'OW' },
    ],
  },
  {
    id: 'q5',
    prompt: "You're given a vague brief with no clear spec. Reaction?",
    options: [
      { label: 'Start sketching a few different directions', axis: 'CR' },
      { label: 'Ask what the end user actually needs', axis: 'OW' },
      { label: 'Ask for the missing requirements before starting', axis: 'ST' },
      { label: 'Map out how this connects to everything else first', axis: 'SY' },
    ],
  },
  {
    id: 'q6',
    prompt: 'What frustrates you most in a group project?',
    options: [
      { label: "People not explaining their reasoning", axis: 'AN' },
      { label: 'No one owning the final decision', axis: 'OW' },
      { label: 'Nobody flagging the obvious risks', axis: 'SE' },
      { label: 'No consistent process, everyone improvising', axis: 'ST' },
    ],
  },
  {
    id: 'q7',
    prompt: "Pick the task you'd choose first from a backlog:",
    options: [
      { label: 'Fix a bug nobody can explain', axis: 'AN' },
      { label: 'Redesign a screen that looks dated', axis: 'CR' },
      { label: 'Talk to users about what they actually need', axis: 'CO' },
      { label: 'Map how three systems should talk to each other', axis: 'SY' },
    ],
  },
  {
    id: 'q8',
    prompt: 'Your proudest past project — why?',
    options: [
      { label: 'It solved a genuinely hard problem', axis: 'AN' },
      { label: 'It looked and felt great to use', axis: 'CR' },
      { label: 'People actually used it and it mattered', axis: 'OW' },
      { label: 'It held up under real-world pressure', axis: 'SE' },
    ],
  },
  {
    id: 'q9',
    prompt: 'A deadline is tight. What do you protect first?',
    options: [
      { label: 'Getting the core logic right', axis: 'AN' },
      { label: 'A consistent, repeatable process', axis: 'ST' },
      { label: "Making sure the team's aligned on the plan", axis: 'CO' },
      { label: 'Making sure nothing critical is left exposed', axis: 'SE' },
    ],
  },
  {
    id: 'q10',
    prompt: 'Which role would you enjoy most on a team project?',
    options: [
      { label: 'The one who figures out why things break', axis: 'AN' },
      { label: 'The one who designs how it looks and feels', axis: 'CR' },
      { label: 'The one who decides what gets built next', axis: 'OW' },
      { label: 'The one who keeps everyone on the same page', axis: 'CO' },
    ],
  },
  {
    id: 'q11',
    prompt: "You notice a process that's inefficient. What do you do?",
    options: [
      { label: 'Analyze exactly where the inefficiency comes from', axis: 'AN' },
      { label: 'Sketch a better-looking way to do it', axis: 'CR' },
      { label: 'Write a clearer, more structured process', axis: 'ST' },
      { label: 'Think about how it affects everything downstream', axis: 'SY' },
    ],
  },
  {
    id: 'q12',
    prompt: "Something's about to launch. What worries you most?",
    options: [
      { label: 'Whether it can be misused or broken into', axis: 'SE' },
      { label: "Whether it's actually the right thing to launch", axis: 'OW' },
      { label: "Whether it'll hold up at scale", axis: 'SY' },
      { label: 'Whether people will understand how to use it', axis: 'CO' },
    ],
  },
  {
    id: 'q13',
    prompt: "You're free to choose your next learning goal. Pick one:",
    options: [
      { label: 'A hard algorithm or reasoning problem', axis: 'AN' },
      { label: 'A new design or visual skill', axis: 'CR' },
      { label: 'How large systems are architected', axis: 'SY' },
      { label: 'How to communicate technical ideas clearly', axis: 'CO' },
    ],
  },
  {
    id: 'q14',
    prompt: "A plan changes suddenly. Your first reaction?",
    options: [
      { label: 'Figure out what broke to cause the change', axis: 'AN' },
      { label: 'Check what it puts at risk', axis: 'SE' },
      { label: 'Reconfirm the process for handling changes', axis: 'ST' },
      { label: 'Decide whether the new plan still serves the goal', axis: 'OW' },
    ],
  },
  {
    id: 'q15',
    prompt: "What's more satisfying to you?",
    options: [
      { label: 'Solving one very hard problem well', axis: 'AN' },
      { label: 'Making something people enjoy using', axis: 'CR' },
      { label: 'Getting a whole system to work end-to-end', axis: 'SY' },
      { label: 'Getting a group of people to agree and move together', axis: 'CO' },
    ],
  },
  {
    id: 'q16',
    prompt: "You're reviewing someone else's work. What do you check first?",
    options: [
      { label: 'Whether the reasoning holds up', axis: 'AN' },
      { label: 'Whether it introduces any risk', axis: 'SE' },
      { label: 'Whether it follows the agreed process', axis: 'ST' },
      { label: 'Whether it actually solves the user problem', axis: 'OW' },
    ],
  },
  {
    id: 'q17',
    prompt: 'Pick the feedback you would rather give:',
    options: [
      { label: 'This could be more efficient', axis: 'AN' },
      { label: 'This could look or feel better', axis: 'CR' },
      { label: 'This needs a clearer process', axis: 'ST' },
      { label: 'This needs better team alignment', axis: 'CO' },
    ],
  },
  {
    id: 'q18',
    prompt: 'What kind of problem energizes you most?',
    options: [
      { label: 'One with a lot of moving, connected parts', axis: 'SY' },
      { label: 'One where the risk of getting it wrong is high', axis: 'SE' },
      { label: 'One where you get to decide the direction', axis: 'OW' },
      { label: "One where you're explaining or persuading someone", axis: 'CO' },
    ],
  },
  {
    id: 'q19',
    prompt: 'You have one hour of free focus time. You would spend it:',
    options: [
      { label: 'Debugging something tricky', axis: 'AN' },
      { label: 'Making something look better', axis: 'CR' },
      { label: 'Planning what to prioritize next', axis: 'OW' },
      { label: "Documenting a process so it's repeatable", axis: 'ST' },
    ],
  },
  {
    id: 'q20',
    prompt: 'What kind of mistake bothers you most?',
    options: [
      { label: "A logical error that should've been caught", axis: 'AN' },
      { label: "A security gap that should've been caught", axis: 'SE' },
      { label: 'A process that was not followed', axis: 'ST' },
      { label: 'A system that was not designed to scale', axis: 'SY' },
    ],
  },
  {
    id: 'q21',
    prompt: "Last one — what would colleagues say you're known for?",
    options: [
      { label: 'Explaining things clearly', axis: 'CO' },
      { label: 'Making things look good', axis: 'CR' },
      { label: 'Making the right call under pressure', axis: 'OW' },
      { label: 'Making sure things connect properly end-to-end', axis: 'SY' },
    ],
  },
]

// Max possible score per axis (each axis appears ~12 times across 84 options)
export const MAX_AXIS_SCORE = 12

// Archetype vectors — one per career, 0-1 per axis
export interface Archetype {
  career: string
  vector: Record<AxisKey, number>
}

export const ARCHETYPES: Archetype[] = [
  { career: 'Software Engineer',     vector: { AN: 0.85, CR: 0.50, SY: 0.70, CO: 0.45, ST: 0.65, SE: 0.50, OW: 0.55 } },
  { career: 'AI Engineer',            vector: { AN: 0.85, CR: 0.55, SY: 0.65, CO: 0.40, ST: 0.55, SE: 0.40, OW: 0.50 } },
  { career: 'Data Scientist',        vector: { AN: 0.90, CR: 0.45, SY: 0.60, CO: 0.55, ST: 0.60, SE: 0.35, OW: 0.45 } },
  { career: 'Cybersecurity Engineer', vector: { AN: 0.75, CR: 0.35, SY: 0.70, CO: 0.45, ST: 0.70, SE: 0.95, OW: 0.45 } },
  { career: 'UI/UX Designer',        vector: { AN: 0.45, CR: 0.95, SY: 0.40, CO: 0.75, ST: 0.45, SE: 0.30, OW: 0.65 } },
  { career: 'Product Manager',       vector: { AN: 0.55, CR: 0.50, SY: 0.60, CO: 0.90, ST: 0.55, SE: 0.35, OW: 0.90 } },
  { career: 'DevOps Engineer',       vector: { AN: 0.65, CR: 0.35, SY: 0.85, CO: 0.45, ST: 0.85, SE: 0.65, OW: 0.45 } },
]
