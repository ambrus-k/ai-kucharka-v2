const fs = require('fs');

const apiContent = fs.readFileSync('api/index.ts', 'utf8');

// Instead of complex regex, let's just rewrite the file preserving the necessary endpoints and omitting the Git ones.
// I'll extract everything up to `async function runGitSync`
const idxGitSync = apiContent.indexOf('async function runGitSync');

// Then I'll extract the endpoints that we need to keep
// We need GET /api/config, GET /api/health, GET /api/recipes, POST /api/recipes
// POST /api/enhance-recipe, POST /api/edit-recipe, POST /api/audit-recipe, POST /api/calculate-nutrition

// Let's do it cleanly by searching for function signatures and removing them
let newContent = apiContent;

const functionsToRemove = [
    'async function runGitSync',
    'app.post("/api/sync-codebase"',
    'app.post("/api/sync-github"',
    'app.get("/api/github-config"',
    'app.post("/api/github-config"',
    'app.get("/api/github-status"',
    'app.post("/api/test-diagnostics"'
];

for (const fn of functionsToRemove) {
    const regex = new RegExp(`^${fn.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?\\}\\);?$`, 'gm');
    // For runGitSync which is just a function declaration
    if (fn === 'async function runGitSync') {
       const fnRegex = /^async function runGitSync[\s\S]*?^}$/gm;
       newContent = newContent.replace(fnRegex, '');
    } else {
       newContent = newContent.replace(regex, '');
    }
}

// Let's use a simpler approach. I will just rewrite api/index.ts completely with only the required code.
