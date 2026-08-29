const fs = require('fs');

function run() {
  const tsxPath = 'src/components/DashboardLayout.tsx';
  let tsx = fs.readFileSync(tsxPath, 'utf8');

  // 1. Remove the old sidebar-collapse-btn
  const oldBtnRegex = /<button className="sidebar-collapse-btn hidden md:flex" onClick=\{\(\) => setIsCollapsed\(!isCollapsed\)\}>\s*<ChevronLeft width=\{14\} height=\{14\} \/>\s*<\/button>\s*/;
  tsx = tsx.replace(oldBtnRegex, '');

  // 2. Add onClick to <aside>
  tsx = tsx.replace(
    '<aside className="sidebar relative">',
    `<aside 
          className="sidebar relative" 
          style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
          onClick={(e) => {
            if (isCollapsed) {
              if ((e.target).closest('a, button')) return;
              setIsCollapsed(false);
            }
          }}
        >`
  );

  // 3. Wrap side-brand and add new control
  const brandStart = tsx.indexOf('<Link to="/dashboard" className="side-brand">');
  const brandEndStr = '</div>\n          </Link>';
  const brandEnd = tsx.indexOf(brandEndStr, brandStart) + brandEndStr.length;
  
  const oldBrandSection = tsx.substring(brandStart, brandEnd);
  
  const newBrandSection = `<div className="flex items-center justify-between mb-[26px]">
            ${oldBrandSection.replace('className="side-brand"', 'className="side-brand mb-0" style={{ marginBottom: 0 }}')}
            {!isCollapsed && (
              <button 
                className="text-text-muted hover:text-text transition-colors p-1"
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}
                title="Collapse sidebar"
              >
                <PanelLeftClose width={18} height={18} />
              </button>
            )}
            {isCollapsed && (
              <button 
                className="text-text-muted hover:text-text transition-colors mx-auto p-1"
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                title="Expand sidebar"
              >
                <PanelLeftClose width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
          </div>`;
          
  tsx = tsx.replace(oldBrandSection, newBrandSection);

  // 4. Fix type error in e.target for TypeScript by adding type assertion
  tsx = tsx.replace(
    `if ((e.target).closest('a, button')) return;`,
    `if ((e.target as HTMLElement).closest('a, button')) return;`
  );

  fs.writeFileSync(tsxPath, tsx);

  const cssPath = 'src/components/DashboardLayout.css';
  let css = fs.readFileSync(cssPath, 'utf8');

  // Remove .sidebar-collapse-btn rules
  css = css.replace(/\.sidebar-collapse-btn \{[\s\S]*?\}\n/g, '');
  css = css.replace(/\.sidebar-collapse-btn:hover \{[\s\S]*?\}\n/g, '');
  css = css.replace(/\.dashboard-page-root \.layout\.collapsed \.sidebar-collapse-btn \{[\s\S]*?\}\n/g, '');
  css = css.replace(/@media \(max-width: 980px\) \{\s*\.sidebar-collapse-btn \{ display: none !important; \}\s*\}/g, '');
  
  // Make side-brand padding adjust dynamically
  css = css.replace(
    /\.dashboard-page-root \.side-brand \{[\s\S]*?\}/,
    `.dashboard-page-root .side-brand {
  display:flex; align-items:center; gap:10px;
  padding: 4px 8px 6px;
}`
  );

  fs.writeFileSync(cssPath, css);
  console.log("Done");
}

run();
