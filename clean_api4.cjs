const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');
content = content.replace(/import \{ Octokit \} from "@octokit\/rest";\n?/g, '');
fs.writeFileSync('api/index.ts', content);
