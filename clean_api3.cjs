const fs = require('fs');

const original = fs.readFileSync('api/index.ts', 'utf8');

// Replace the GET /api/recipes with a clean Firestore-only implementation
let newContent = original.replace(/app\.all\(\["\/api", "\/api\/recipes", "\/api\/recipes\/", "\/recipes", "\/recipes\/"\], async \(req, res\) => \{[\s\S]*?\}\);\s*app\.post\(\["\/api\/verify-admin/g, 'app.post(["/api/verify-admin');

fs.writeFileSync('api/index.ts', newContent);
