const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

content = content.replace(
  'const db = getFirestore(firebaseApp);',
  'const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);'
);

fs.writeFileSync('api/index.ts', content);
