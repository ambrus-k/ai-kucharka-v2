const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the Github nav button
const navButtonOld = `                  <button
                    type="button"
                    onClick={() => setActiveAdminTab("github")}
                    className={\`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left \${
                      activeAdminTab === "github"
                        ? "bg-[#1B4332] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }\`}
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>GitHub Synchronizace</span>
                  </button>`;
content = content.replace(navButtonOld, '');

// 2. Remove the GitHub tab content
const tabStart = '{/* TAB 2: GITHUB SYNC */}';
const tabEnd = '{/* TAB 3: CATEGORIES MANAGEMENT */}'; // Let's check what the next tab is.
