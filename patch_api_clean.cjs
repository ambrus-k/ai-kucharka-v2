const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// 1. Remove Octokit and child_process imports
content = content.replace(/import \{ Octokit \} from "@octokit\/rest";\n?/g, '');
content = content.replace(/import \{ exec \} from "child_process";\n?/g, '');

// 2. Replace GET /api/recipes
const getRecipesOld = /app\.get\(\["\/api", "\/api\/recipes", "\/api\/recipes\/", "\/recipes", "\/recipes\/"\], async \(req, res\) => \{[\s\S]*?\}\);/g;
const getRecipesNew = `app.get(["/api", "/api/recipes", "/api/recipes/", "/recipes", "/recipes/"], async (req, res) => {
  try {
    const recipesSnapshot = await getDocs(collection(db, "recipes"));
    let recipes = recipesSnapshot.docs.map(doc => doc.data());
    
    if (recipes.length === 0) {
      console.log("[Recipes DB] Firestore is empty, seeding from local data...");
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
    }
    
    recipes = ensureNutrition(recipes);
    return res.json(recipes);
  } catch (err) {
    console.error("[Recipes DB] Chyba pri nacitani receptu:", err);
    return res.status(500).json({ error: "Chyba při načítání receptů z databáze." });
  }
});`;

if (content.match(getRecipesOld)) {
    content = content.replace(getRecipesOld, getRecipesNew);
} else {
    console.log("Could not find GET /api/recipes with regex.");
}

// 3. Remove dead code (runGitSync, etc)
// Just regex replace the blocks if possible, or we can use AST. It's safer to just overwrite index.ts completely with a clean version, but let's try to strip it.
// Actually, let's just create a completely clean api/index.ts because there's so much dead code.
