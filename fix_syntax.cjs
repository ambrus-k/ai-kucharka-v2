const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');
content = content.replace(/    \}\n    return res\.status\(401\)\.json\(\{ error: "Neplatný administrační kód nebo GitHub Token\." \}\);\n  \} catch \(error\) \{\n    return res\.status\(500\)\.json\(\{ error: "Chyba při ověřování hesla\." \}\);\n  \}\n\}\);/g, '');
fs.writeFileSync('api/index.ts', content);
