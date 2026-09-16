const fs = require('fs');

const content = fs.readFileSync('api/index.ts', 'utf8');
fs.writeFileSync('api/index_backup2.ts', content);

