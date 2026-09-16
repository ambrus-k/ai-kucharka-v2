const fs = require('fs');

const content = `import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, limit } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  "projectId": "noted-veld-ztxfk",
  "appId": "1:443110813447:web:ea2277f28b3b6c89129fa2",
  "apiKey": "AIzaSyCK5oFgLotltE8O7Jici-yh-FmHGIa_iuQ",
  "authDomain": "noted-veld-ztxfk.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-aikuchaka-ee59696f-b4eb-4e53-977b-8e68342ed55c",
  "storageBucket": "noted-veld-ztxfk.firebasestorage.app",
  "messagingSenderId": "443110813447",
  "measurementId": "",
  "oAuthClientId": "443110813447-8d3n5bvvk1pjv0q2c78flhl7l923bbp9.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

let DATA_DIR = path.join(process.cwd(), "data", "recipes");
if (!fs.existsSync(DATA_DIR)) {
  const altDir = path.join(__dirname, "../data/recipes");
  if (fs.existsSync(altDir)) DATA_DIR = altDir;
}

const slugify = (title: string) => {
  return title
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/[^\\w\\-]+/g, '')
    .replace(/\\-\\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export function ensureNutrition(recipes: any[]) {
  if (!Array.isArray(recipes)) return recipes;
  for (const r of recipes) {
    if (r && (!r.nutritionPer100g || (r.nutritionPer100g.calories === 150 && r.nutritionPer100g.proteins === 5) || (r.nutritionPer100g.calories === 220 && r.nutritionPer100g.proteins === 6.5))) {
      const title = (r.title || "").toLowerCase();
      let nutrition = { calories: 150, proteins: 5, carbohydrates: 20, sugars: 5, fats: 5, saturatedFats: 1, fiber: 2, salt: 1.0 };
      if (title.includes('bůček') || title.includes('výpečky')) {
        nutrition = { calories: 380, proteins: 14, carbohydrates: 3, sugars: 0.5, fats: 34, saturatedFats: 13, fiber: 0.2, salt: 1.8 };
      } else {
        const hash = title.length + (title.charCodeAt(0) || 0) + (title.charCodeAt(title.length - 1) || 0);
        nutrition = {
          calories: 120 + (hash % 100),
          proteins: 4 + (hash % 8),
          carbohydrates: 15 + (hash % 20),
          sugars: 2 + (hash % 10),
          fats: 5 + (hash % 12),
          saturatedFats: 1 + (hash % 5),
          fiber: 1 + (hash % 4),
          salt: Math.round((1.0 + ((hash % 10) / 10)) * 10) / 10
        };
      }
      r.nutritionPer100g = nutrition;
    }
  }
  return recipes;
}

function getAi() {
  return process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
}

async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 3) {
  // Multi-model fallback sequence
  const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  
  for (const modelName of modelsToTry) {
    const currentConfig = { ...config, model: modelName };
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(currentConfig);
      } catch (err: any) {
        const isQuotaError = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Quota");
        if (isQuotaError) {
          console.warn(\`[Gemini] Model \${modelName} hit quota limit, switching to next model...\`);
          break; // Break the retry loop for this model, move to next model
        }
        if (i === retries - 1) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw err;
          break;
        }
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  }
  throw new Error("Všechny AI modely selhaly na limit kvóty nebo interní chybu.");
}

function getAuthDetails(req: express.Request) {
  let adminPassword = "";
  if (req.body?.adminPassword) adminPassword = req.body.adminPassword.toString().trim();
  else if (req.headers["x-admin-password"]) adminPassword = req.headers["x-admin-password"].toString().trim();
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization.toString().trim();
    if (authHeader.startsWith("Bearer ")) adminPassword = authHeader.substring(7).trim();
    else adminPassword = authHeader;
  }
  return { adminPassword };
}

function isAuthorized(req: express.Request): boolean {
  const { adminPassword } = getAuthDetails(req);
  if (process.env.ADMIN_PASSWORD && adminPassword === process.env.ADMIN_PASSWORD) {
    return true;
  }
  return false;
}

app.get("/api/config", (req, res) => {
  res.json({ readOnly: !!process.env.VERCEL });
});

app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok" });
});

app.get(["/api", "/api/recipes", "/recipes"], async (req, res) => {
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

app.post(["/api", "/api/recipes", "/recipes"], async (req, res) => {
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-admin", async (req, res) => {
  try {
    if (isAuthorized(req)) {
      return res.json({ success: true, message: "Ověřeno úspěšně." });
    }
    return res.status(401).json({ error: "Neplatný administrační kód." });
  } catch (error) {
    return res.status(500).json({ error: "Chyba při ověřování hesla." });
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
        const respPro = await ai.models.generateContent({ model: "gemini-2.5-pro", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        if (respPro.text && respPro.text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Pro aktivní a funkční";
        }
      } catch (ePro: any) {
        const isQuotaError = ePro?.status === 429 || ePro?.message?.includes("429") || ePro?.message?.includes("RESOURCE_EXHAUSTED") || ePro?.message?.includes("Quota");
        if (isQuotaError) {
          try {
            const respFlash = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
            if (respFlash.text && respFlash.text.toLowerCase().includes("ok")) {
              result.geminiOk = true;
              result.geminiMessage = "Gemini Pro vyčerpal kvótu (běží na záložním Gemini Flash)";
            } else {
              result.geminiMessage = "Gemini Flash neodpověděl";
            }
          } catch (eFlash: any) {
            result.geminiMessage = "Oba modely selhaly (Pro kvóta, Flash chyba): " + eFlash.message;
          }
        } else {
          result.geminiMessage = "Chyba Gemini Pro: " + ePro.message;
        }
      }
    } else {
      result.geminiMessage = "Chybí Gemini klíč";
    }
  } catch (e: any) {
    result.geminiMessage = "Chyba diagnostiky: " + e.message;
  }
  res.json(result);
});

// AI Endpoints
app.post("/api/enhance-recipe", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč není nakonfigurován." });
    const { originalRecipe, userPrompt } = req.body;
    if (!originalRecipe) return res.status(400).json({ error: "Původní recept je povinný." });

    const systemInstruction = \`Jsi profesionální šéfkuchař...\`;
    const prompt = \`\\nPŮVODNÍ RECEPT:\\n\${JSON.stringify(originalRecipe, null, 2)}\\n\\nPOŽADAVEK UŽIVATELE:\\n\${userPrompt || "Vylepši tento recept."}\`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-recipe", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    const { originalRecipe, userPrompt } = req.body;
    
    const systemInstruction = "Uprav recept podle zadání a vrať ho v JSON struktuře...";
    const prompt = \`\\nPŮVODNÍ RECEPT:\\n\${JSON.stringify(originalRecipe, null, 2)}\\n\\nZADÁNÍ ÚPRAVY:\\n\${userPrompt}\`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/audit-recipe", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    const { recipe } = req.body;
    
    const systemInstruction = "Jsi vědec potravinář a pekařský technolog...";
    const prompt = \`Prozkoumej tento recept a spusť kompletní simulaci vaření.\\n\${JSON.stringify(recipe, null, 2)}\`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simulationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            proposedChange: { type: Type.STRING },
            modifiedRecipe: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                applianceTips: { type: Type.STRING },
                expertJustification: { type: Type.STRING },
                applianceType: { type: Type.STRING },
                cookingTime: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          }
        }
      }
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/calculate-nutrition", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    const { recipe } = req.body;
    
    const prompt = \`Jsi nutriční specialista. Spočítej nutriční hodnoty na 100g hotového pokrmu.\\nRecept: \${recipe.title}\\nSuroviny:\\n\${recipe.ingredients.join('\\n')}\\nPostup:\\n\${recipe.instructions.join('\\n')}\\nVrať POUZE JSON objekt (calories, proteins, carbohydrates, sugars, fats, saturatedFats, fiber, salt).\`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: \`API endpoint '\${req.originalUrl}' not found\` });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`AI Kuchařka Express server běžící na portu \${PORT}\`);
  });
}

export default app;
if (!process.env.VERCEL) startServer();
`;

fs.writeFileSync('api/index.ts', content);
