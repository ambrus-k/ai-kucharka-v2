const fs = require('fs');
const content = fs.readFileSync('api/index.ts', 'utf8');

const prefix = content.substring(0, content.indexOf('function isAuthorized'));

const newContent = prefix + `function isAuthorized(req: express.Request): boolean {
  const { adminPassword } = getAuthDetails(req);
  if (process.env.ADMIN_PASSWORD && adminPassword === process.env.ADMIN_PASSWORD) {
    return true;
  }
  return false;
}

// Config endpoint
app.get("/api/config", (req, res) => {
  res.json({ readOnly: !!process.env.VERCEL });
});

// Health check endpoint
app.get(["/api/health", "/api/health/", "/health", "/health/"], (req, res) => {
  res.json({ status: "ok" });
});

app.get(["/api", "/api/recipes", "/api/recipes/", "/recipes", "/recipes/"], async (req, res) => {
  try {
    const recipesSnapshot = await getDocs(collection(db, "recipes"));
    let recipes = recipesSnapshot.docs.map(doc => doc.data());
    
    if (recipes.length === 0) {
      console.log("[Recipes DB] Firestore is empty, seeding from local data...");
      try {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
        const localRecipes = files.map(file => {
          try {
            return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
          } catch (e) { return null; }
        }).filter(Boolean);
        
        for (const r of localRecipes) {
          if (r) {
            const recipeId = r.id || slugify(r.title);
            r.id = recipeId;
            await setDoc(doc(db, "recipes", r.id), r);
          }
        }
        recipes = localRecipes;
      } catch(e) {}
    }
    
    recipes = ensureNutrition(recipes);
    return res.json(recipes);
  } catch (err) {
    console.error("[Recipes DB] Chyba pri nacitani receptu:", err);
    return res.status(500).json({ error: "Chyba při načítání receptů z databáze." });
  }
});

app.post(["/api", "/api/recipes", "/api/recipes/", "/recipes", "/recipes/"], async (req, res) => {
  if (process.env.VERCEL) {
    return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  }
  try {
    if (!isAuthorized(req)) return res.status(401).json({ error: "Přístup odepřen." });
    let recipesList = req.body;
    if (!Array.isArray(recipesList)) {
      if (recipesList && Array.isArray(recipesList.recipes)) recipesList = recipesList.recipes;
      else return res.status(400).json({ error: "Chybí seznam receptů." });
    }
    const activeIds = new Set();
    for (const r of recipesList) {
      if (!r) continue;
      r.id = r.id || slugify(r.title);
      activeIds.add(r.id);
      await setDoc(doc(db, "recipes", r.id), r, { merge: true });
    }
    const recipesSnapshot = await getDocs(collection(db, "recipes"));
    const existingIds = recipesSnapshot.docs.map(doc => doc.id);
    for (const id of existingIds) {
      if (!activeIds.has(id)) await deleteDoc(doc(db, "recipes", id));
    }
    return res.json({ success: true, count: recipesList.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/test-diagnostics", async (req, res) => {
  const result = {
    timestamp: new Date().toISOString(),
    firestoreOk: false,
    firestoreMessage: "Probíhá test",
    geminiOk: false,
    geminiMessage: "Probíhá test",
    recipesCount: 0
  };
  try {
    const q = query(collection(db, "recipes"), limit(1));
    const qs = await getDocs(q);
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
      const resp = await generateContentWithRetry(ai, {
        model: "gemini-3.1-pro-preview",
        contents: "Odpověz jen slovem 'ok'",
        config: { maxOutputTokens: 10 }
      });
      if (resp.text && resp.text.toLowerCase().includes("ok")) {
        result.geminiOk = true;
        result.geminiMessage = "AI připojeno a reaguje";
      } else {
        result.geminiMessage = "AI neodpovědělo korektně";
      }
    } else {
      result.geminiMessage = "Chybí Gemini klíč";
    }
  } catch (e) {
    result.geminiMessage = "Chyba Gemini: " + e.message;
  }
  res.json(result);
});

` + content.substring(content.indexOf('app.post(["/api/verify-admin"'));

fs.writeFileSync('api/index.ts', newContent);
