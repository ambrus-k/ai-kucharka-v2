const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf-8');

// 1. Add Firebase imports at the top
const firebaseImports = `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
`;
content = content.replace('import dotenv from "dotenv";', firebaseImports + '\nimport dotenv from "dotenv";');

// 2. Replace GET /api/recipes local files fallback with Firestore logic
const getRecipesRegex = /\/\/ Fallback to local files[\s\S]*?return res\.json\(ensureNutrition\(recipes\)\);/g;
const getRecipesReplacement = `
    // Fallback to Firestore (replacing local files)
    try {
      const recipesSnapshot = await getDocs(collection(db, "recipes"));
      const recipes = recipesSnapshot.docs.map(doc => doc.data());
      if (recipes.length === 0) {
        // If Firestore is empty, seed it from local fallback once
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
        const localRecipes = files.map(file => {
          try {
            return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
          } catch (e) { return null; }
        }).filter(Boolean);
        
        // Save to Firestore
        for (const r of localRecipes) {
          if (r && r.id) {
            await setDoc(doc(db, "recipes", r.id), r);
          }
        }
        return res.json(ensureNutrition(localRecipes));
      }
      return res.json(ensureNutrition(recipes));
    } catch (dbError) {
      console.error("[Firestore DB Error]", dbError);
      return res.status(500).json({ error: "Chyba při načítání z databáze" });
    }
`;
content = content.replace(getRecipesRegex, getRecipesReplacement);

// 3. Replace POST /api/recipes local write logic with Firestore
const postRecipesRegex = /let localWriteOk = true;[\s\S]*?const existingFiles = fs\.readdirSync\(DATA_DIR\)\.filter\(f => f\.endsWith\("\.json"\)\);[\s\S]*?console\.warn\(\`\[Local DB Warning\] Nelze spravovat smazání lokálních souborů:\`, delErr\.message\);\n    \}/g;
const postRecipesReplacement = `
    let localWriteOk = true;
    let writeErrorMessage = "";
    let deletedCount = 0;

    try {
      // Get existing in Firestore to compute deletions
      const recipesSnapshot = await getDocs(collection(db, "recipes"));
      const existingIds = recipesSnapshot.docs.map(doc => doc.id);
      
      const activeIds = new Set();
      
      for (const r of recipesList) {
        if (!r || !r.id) continue;
        activeIds.add(r.id);
        await setDoc(doc(db, "recipes", r.id), r);
      }
      
      // Delete missing
      for (const id of existingIds) {
        if (!activeIds.has(id)) {
          await deleteDoc(doc(db, "recipes", id));
          deletedCount++;
        }
      }
    } catch (dbError) {
      localWriteOk = false;
      writeErrorMessage = dbError.message || dbError;
    }
`;
content = content.replace(postRecipesRegex, postRecipesReplacement);

fs.writeFileSync('api/index.ts', content);
console.log('Patched api/index.ts');
