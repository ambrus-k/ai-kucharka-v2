const fs = require('fs');

// 1. Update api/index.ts
let apiContent = fs.readFileSync('api/index.ts', 'utf8');

// Update modelsToTry
apiContent = apiContent.replace(
  'const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];',
  'const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];'
);

// Update parseAiJson typing
apiContent = apiContent.replace(
  'function parseAiJson(text: string | undefined | null) {',
  'function parseAiJson(text: string | undefined | null): any {'
);

// Update /api/test-diagnostics
const diagOld = `        const respFlash = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        const text = respFlash.text || "";
        if (text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Flash model je aktivní a plně funkční";
        } else {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Flash je připojen, ale vrátil: " + text;
        }`;

const diagNew = `        const respFlash = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        const text = respFlash.text || "";
        if (text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini AI (Free 1.5 Flash) je aktivní a funkční";
        } else {
          result.geminiOk = true;
          result.geminiMessage = "Gemini 1.5 Flash je připojen, ale vrátil: " + text;
        }`;

apiContent = apiContent.replace(diagOld, diagNew);
fs.writeFileSync('api/index.ts', apiContent);

// 2. Update package.json
let pkgContent = fs.readFileSync('package.json', 'utf8');
const pkg = JSON.parse(pkgContent);
pkg.scripts.build = "vite build";
// Update start to tsx server.ts so the AI Studio preview doesn't break
pkg.scripts.start = "tsx server.ts";
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
fs.writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2) + '\\n');
