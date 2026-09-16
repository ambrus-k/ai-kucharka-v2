const fs = require('fs');

const original = fs.readFileSync('api/index.ts', 'utf8');
const lines = original.split('\n');

let keep = true;
let newLines = [];
let braceLevel = 0;

const startsToRemove = [
    'async function runGitSync',
    'app.post("/api/sync-codebase"',
    'app.post("/api/sync-github"',
    'app.get("/api/github-config"',
    'app.post("/api/github-config"',
    'app.get("/api/github-status"',
    'app.post("/api/test-diagnostics"'
];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (keep) {
        let matched = false;
        for (const start of startsToRemove) {
            if (line.includes(start)) {
                matched = true;
                keep = false;
                braceLevel = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                break;
            }
        }
        if (!matched) {
            newLines.push(line);
        }
    } else {
        braceLevel += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (braceLevel <= 0) {
            keep = true;
        }
    }
}

// Write it back
fs.writeFileSync('api/index.ts', newLines.join('\n'));
