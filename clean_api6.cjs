const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');
content = content.replace(/app\.post\(\["\/api\/verify-admin[\s\S]*?\}\);/g, '');
fs.writeFileSync('api/index.ts', content);
