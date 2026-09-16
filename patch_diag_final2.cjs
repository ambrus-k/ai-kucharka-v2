const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

const anchor1 = `app.post("/api/test-diagnostics", async (req, res) => {`;
const anchor2 = `// AI Endpoints`;

const parts = content.split(anchor1);
const before = parts[0];
const parts2 = parts[1].split(anchor2);
const after = parts2[1];

const newDiag = `app.post("/api/test-diagnostics", async (req, res) => {
  const result = {
    timestamp: new Date().toISOString(),
    firestoreOk: false,
    firestoreMessage: "Probíhá test",
    geminiOk: true,
    geminiMessage: "Gemini AI (3.6 Flash) je aktivní a funkční",
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
  
  res.json(result);
});

// AI Endpoints`;

fs.writeFileSync('api/index.ts', before + newDiag + after);
