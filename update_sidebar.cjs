const fs = require('fs');
const tsxFile = 'src/components/DashboardLayout.tsx';
let tsx = fs.readFileSync(tsxFile, 'utf8');

// Add ChevronLeft import
tsx = tsx.replace(
  'LogOut, Shield, Settings, Bell, Clock, Search\n} from \'lucide-react\'',
  'LogOut, Shield, Settings, Bell, Clock, Search, ChevronLeft\n} from \'lucide-react\''
);

// Add useState
tsx = tsx.replace(
  'import { useAuthStore } from \'../lib/authStore\'',
  'import { useAuthStore } from \'../lib/authStore\'\nimport { useState, useEffect } from \'react\''
);

// Add state to component
tsx = tsx.replace(
  'const { profile } = useAuthStore()',
  'const { profile } = useAuthStore()\n  const [isCollapsed, setIsCollapsed] = useState(() => window.localStorage.getItem("sidebar-collapsed") === "true")\n  useEffect(() => { window.localStorage.setItem("sidebar-collapsed", isCollapsed) }, [isCollapsed])'
);

// Add collapsed class to layout
tsx = tsx.replace(
  '<div className="layout">',
  '<div className={`layout ${isCollapsed ? \'collapsed\' : \'\'}`}>'
);

// Add collapse button and fix sidebar class
tsx = tsx.replace(
  '<aside className="sidebar">',
  `<aside className="sidebar relative">
          <button className="sidebar-collapse-btn hidden md:flex" onClick={() => setIsCollapsed(!isCollapsed)}>
            <ChevronLeft width={14} height={14} />
          </button>`
);

// Fix NavLinks to include span and title
tsx = tsx.replace(
  /\{n\.label\}/g,
  '<span className="nav-label">{n.label}</span>'
);

// Fix Admin and Settings/Sign out NavLinks
tsx = tsx.replace(
  'Admin\n              </NavLink>',
  '<span className="nav-label">Admin</span>\n              </NavLink>'
);

tsx = tsx.replace(
  'Settings\n            </Link>',
  '<span className="nav-label">Settings</span>\n            </Link>'
);

tsx = tsx.replace(
  'Sign out\n            </button>',
  '<span className="nav-label">Sign out</span>\n            </button>'
);

// Add title to NavLinks for tooltips
tsx = tsx.replace(
  /<NavLink\s+key=\{n\.to\}\s+to=\{n\.to\}/g,
  '<NavLink key={n.to} to={n.to} title={isCollapsed ? n.label : undefined}'
);
tsx = tsx.replace(
  /<NavLink to="\/admin"/g,
  '<NavLink to="/admin" title={isCollapsed ? "Admin" : undefined}'
);
tsx = tsx.replace(
  /<Link className="nav-item" to="\/profile">/g,
  '<Link className="nav-item" to="/profile" title={isCollapsed ? "Settings" : undefined}>'
);
tsx = tsx.replace(
  /<button className="nav-item" onClick=\{handleSignOut\} style=\{\{ width: '100%', textAlign: 'left' \}\}>/g,
  '<button className="nav-item" onClick={handleSignOut} style={{ width: \'100%\', textAlign: \'left\' }} title={isCollapsed ? "Sign out" : undefined}>'
);

// Also add ThemeToggle to topbar!
tsx = tsx.replace(
  'import { Sparkles, Crown } from \'lucide-react\';',
  'import { Sparkles, Crown } from \'lucide-react\';\nimport { ThemeToggle } from \'./ThemeToggle\';'
);
tsx = tsx.replace(
  '<button className="icon-btn" aria-label="Notifications">',
  '<ThemeToggle />\n                <button className="icon-btn" aria-label="Notifications">'
);

fs.writeFileSync(tsxFile, tsx);

const cssFile = 'src/components/DashboardLayout.css';
let css = fs.readFileSync(cssFile, 'utf8');

const cssAdditions = `
/* COLLAPSIBLE SIDEBAR */
.dashboard-page-root .layout {
  transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dashboard-page-root .layout.collapsed {
  grid-template-columns: 80px 1fr;
}
.dashboard-page-root .sidebar {
  position: sticky;
}
.dashboard-page-root .nav-label {
  transition: opacity 0.2s, width 0.2s;
  white-space: nowrap;
}
.dashboard-page-root .layout.collapsed .nav-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}
.dashboard-page-root .layout.collapsed .side-brand-text {
  display: none;
}
.dashboard-page-root .layout.collapsed .upgrade-box {
  display: none;
}
.dashboard-page-root .layout.collapsed .side-brand {
  justify-content: center;
  padding: 4px 0 6px;
}
.dashboard-page-root .layout.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}
.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  position: absolute;
  right: -12px;
  top: 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.3s, background 0.15s, color 0.15s;
}
.sidebar-collapse-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  background: var(--surface-2);
}
.dashboard-page-root .layout.collapsed .sidebar-collapse-btn {
  transform: rotate(180deg);
}
@media (max-width: 980px) {
  .sidebar-collapse-btn { display: none !important; }
}
`;

css += cssAdditions;
fs.writeFileSync(cssFile, css);
