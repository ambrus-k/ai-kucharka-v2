const fs = require('fs');

const content = fs.readFileSync('api/index.ts', 'utf8');

// I will find the block starting with `app.all(["/api", "/api/recipes"` up to the line before `app.post(["/api/verify-admin"`
const startStr = 'app.all(["/api", "/api/recipes"';
const endStr = 'app.post(["/api/verify-admin"';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const toReplace = content.substring(startIndex, endIndex);
    const newRecipes = `
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
    return res.status(403).json({ error: "Webová aplikace je v režimu pouze pro čtení. Správa receptů probíhá výhradně v AI Studiu." });
  }
  
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen." });
    }

    const bodyData = req.body;
    let recipesList = [];
    if (bodyData && Array.isArray(bodyData)) {
      recipesList = bodyData;
    } else if (bodyData && Array.isArray(bodyData.recipes)) {
      recipesList = bodyData.recipes;
    } else {
      return res.status(400).json({ error: "Chybí seznam receptů v těle požadavku." });
    }

    const recipesSnapshot = await getDocs(collection(db, "recipes"));
    const existingIds = recipesSnapshot.docs.map(doc => doc.id);
    
    const activeIds = new Set();
    
    for (const r of recipesList) {
      if (!r) continue;
      const recipeId = r.id || slugify(r.title);
      r.id = recipeId;
      activeIds.add(r.id);
      
      const docRef = doc(db, "recipes", r.id);
      await setDoc(docRef, r, { merge: true });
    }
    
    for (const id of existingIds) {
      if (!activeIds.has(id)) {
        await deleteDoc(doc(db, "recipes", id));
      }
    }
    
    return res.json({ success: true, count: recipesList.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to save recipes" });
  }
});

`;
    const newContent = content.replace(toReplace, newRecipes);
    fs.writeFileSync('api/index.ts', newContent);
}

