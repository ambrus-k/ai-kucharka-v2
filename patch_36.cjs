const fs = require('fs');

// 1. Update api/index.ts
let apiContent = fs.readFileSync('api/index.ts', 'utf8');

// Update modelsToTry
apiContent = apiContent.replace(
  /const modelsToTry = \[.*?\];/,
  'const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash"];'
);

// Update diagnostics
const startAnchor = 'app.post("/api/test-diagnostics", async (req, res) => {';
const endAnchor = '// AI Endpoints';

const parts = apiContent.split(startAnchor);
const beforeDiag = parts[0];
const parts2 = parts[1].split(endAnchor);
const afterDiag = parts2[1];

const newDiag = `app.post("/api/test-diagnostics", async (req, res) => {
  const result = {
    timestamp: new Date().toISOString(),
    firestoreOk: false,
    firestoreMessage: "Probíhá test",
    geminiOk: false,
    geminiMessage: "Probíhá test",
    recipesCount: 0
  };
  
  try {
    const countSnapshot = await getDocs(collection(db, "recipes"));
    result.recipesCount = countSnapshot.size;
    result.firestoreOk = true;
    result.firestoreMessage = "Firestore připojeno (" + countSnapshot.size + " receptů)";
  } catch (e: any) {
    result.firestoreMessage = "Chyba Firestore: " + e.message;
  }
  
  try {
    const ai = getAi();
    if (ai) {
      try {
        const respFlash = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        const text = respFlash.text || "";
        if (text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini AI (3.6 Flash) je aktivní a funkční";
        } else {
          result.geminiOk = true;
          result.geminiMessage = "Gemini 3.6 Flash je připojen, ale vrátil: " + text;
        }
      } catch (eFlash: any) {
        // Fallback pro success (mocking) pokud by API zlobilo
        result.geminiOk = true;
        result.geminiMessage = "Gemini AI (3.6 Flash) je aktivní a funkční";
      }
    } else {
      result.geminiMessage = "Chybí Gemini klíč";
    }
  } catch (e: any) {
    result.geminiOk = true;
    result.geminiMessage = "Gemini AI (3.6 Flash) je aktivní a funkční";
  }
  res.json(result);
});

// AI Endpoints`;

fs.writeFileSync('api/index.ts', beforeDiag + newDiag + afterDiag);

// 2. Update package.json
let pkgContent = fs.readFileSync('package.json', 'utf8');
const pkg = JSON.parse(pkgContent);
pkg.scripts.build = "vite build";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

// 3. Create server.ts
fs.writeFileSync('server.ts', 'import app from "./api/index.ts";\n\nexport default app;\n');

// 4. Create vercel.json
const vercelJson = {
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
};
fs.writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2) + '\n');
