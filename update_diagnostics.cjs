const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'writePermissionOk: boolean;',
  'firestoreOk: boolean;'
);

content = content.replace(
  'writePermissionMessage: string;',
  'firestoreMessage: string;\n    recipesCount?: number;'
);

content = content.replace(
  'diagnosticsResult.writePermissionOk',
  'diagnosticsResult.firestoreOk'
);
content = content.replace(
  'diagnosticsResult.writePermissionOk',
  'diagnosticsResult.firestoreOk'
);

content = content.replace(
  'diagnosticsResult.writePermissionMessage',
  'diagnosticsResult.firestoreMessage'
);

content = content.replace(
  'Souborový systém:',
  'Firestore Databáze:'
);

fs.writeFileSync('src/App.tsx', content);
