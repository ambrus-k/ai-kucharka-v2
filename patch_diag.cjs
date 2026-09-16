const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const startAnchor = 'app.post("/api/test-diagnostics", async (req, res) => {';
const endAnchor = '// AI Endpoints';

const parts = content.split(startAnchor);
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
  } catch (e) {
    result.firestoreMessage = "Chyba Firestore: " + e.message;
  }
  
  try {
    const ai = getAi();
    if (ai) {
      try {
        const respFlash = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        if (respFlash.text && respFlash.text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Flash model je aktivní a plně funkční";
        } else {
          result.geminiMessage = "Gemini Flash neodpověděl zřetelně";
        }
      } catch (eFlash) {
        result.geminiMessage = "Chyba modelu Gemini Flash: " + eFlash.message;
      }
    } else {
      result.geminiMessage = "Chybí Gemini klíč";
    }
  } catch (e) {
    result.geminiMessage = "Chyba diagnostiky: " + e.message;
  }
  res.json(result);
});

// AI Endpoints`;

fs.writeFileSync('api/index.ts', beforeDiag + newDiag + afterDiag);
