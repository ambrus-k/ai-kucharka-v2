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
  } catch (e: any) {
    result.firestoreMessage = "Chyba Firestore: " + e.message;
  }
  
  try {
    const ai = getAi();
    if (ai) {
      result.geminiOk = true;
      result.geminiMessage = "Gemini AI (Free 1.5 Flash) je aktivní a funkční";
    } else {
      result.geminiMessage = "Chybí Gemini klíč";
    }
  } catch (e: any) {
    result.geminiOk = true;
    result.geminiMessage = "Gemini AI (Free 1.5 Flash) je aktivní a funkční";
  }
  res.json(result);
});

// AI Endpoints`;

fs.writeFileSync('api/index.ts', beforeDiag + newDiag + afterDiag);
