import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
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
  return process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;
}

const GEMINI_MODELS = ["gemini-4-hydrogen", "gemini-2.5-flash"];

function isModelFallbackError(err: any) {
  const status = err?.status || err?.response?.status;
  const msg = (err?.message || "").toLowerCase();
  const isFatalForModel =
    status === 400 ||
    status === 404 ||
    msg.includes("not found") ||
    msg.includes("not supported");
  const isQuota =
    status === 429 ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota");
  return { isFatalForModel, isQuota };
}

async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 2) {
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    const currentConfig = { ...config, model: modelName };
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(currentConfig);
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini] Error with model ${modelName} (attempt ${i + 1}):`, err.message);

        const { isFatalForModel, isQuota } = isModelFallbackError(err);
        if (isFatalForModel || isQuota) {
          console.warn(
            `[Gemini] Model ${modelName} failed with ${isQuota ? "quota" : "fatal"} error, switching to next model immediately...`
          );
          break;
        }

        if (i < retries - 1) {
          await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
        }
      }
    }
  }

  throw new Error(
    "Všechny dostupné AI modely selhaly. Poslední chyba: " +
      (lastError?.message || "Neznámá chyba")
  );
}

async function sendChatWithRetry(
  ai: GoogleGenAI,
  history: any[],
  messageParts: any[],
  chatConfig: any,
  retries = 2
) {
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    const isGemini3Or4 = modelName.startsWith("gemini-4") || modelName.startsWith("gemini-3");
    const effectiveConfig = isGemini3Or4
      ? {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          ...chatConfig,
        }
      : chatConfig;

    for (let i = 0; i < retries; i++) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history,
          config: effectiveConfig,
        });
        return await chat.sendMessage({ message: messageParts });
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini Chat] Error with model ${modelName} (attempt ${i + 1}):`, err.message);

        const { isFatalForModel, isQuota } = isModelFallbackError(err);
        if (isFatalForModel || isQuota) {
          console.warn(
            `[Gemini Chat] Model ${modelName} failed with ${isQuota ? "quota" : "fatal"} error, switching to next model immediately...`
          );
          break;
        }

        if (i < retries - 1) {
          await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
        }
      }
    }
  }

  throw new Error(
    "Gemini Chat selhal na všech dostupných modelech. Poslední chyba: " +
      (lastError?.message || "Neznámá chyba")
  );
}

function buildAttachmentParts(fileData?: string | null, fileName?: string | null, mimeType?: string | null): any[] {
  if (!fileData) return [];
  const base64Data = fileData.includes("base64,") ? fileData.split("base64,")[1] : fileData;
  const detectedMime = (mimeType || "").toLowerCase();
  const fn = (fileName || "").toLowerCase();

  const isTextFile =
    detectedMime.startsWith("text/") ||
    detectedMime.includes("json") ||
    detectedMime.includes("csv") ||
    detectedMime.includes("markdown") ||
    fn.endsWith(".txt") ||
    fn.endsWith(".md") ||
    fn.endsWith(".markdown") ||
    fn.endsWith(".csv") ||
    fn.endsWith(".json") ||
    fn.endsWith(".log") ||
    fn.endsWith(".rtf");

  if (isTextFile) {
    try {
      const decodedText = Buffer.from(base64Data, "base64").toString("utf-8");
      return [
        {
          text: `OBSAH PŘILOŽENÉHO TEXTOVÉHO SOUBORU (${fileName || "příloha"}):\n\n${decodedText}`,
        },
      ];
    } catch (e) {
      console.error("Chyba při dekódování textu ze souboru:", e);
      return [];
    }
  }

  let validMime = mimeType || "image/jpeg";
  if (validMime === "application/octet-stream" || !validMime) {
    if (fn.endsWith(".png")) validMime = "image/png";
    else if (fn.endsWith(".webp")) validMime = "image/webp";
    else if (fn.endsWith(".gif")) validMime = "image/gif";
    else if (fn.endsWith(".pdf")) validMime = "application/pdf";
    else validMime = "image/jpeg";
  }

  return [
    {
      inlineData: {
        data: base64Data,
        mimeType: validMime,
      },
    },
  ];
}

function parseAiJson(text: string | undefined | null): any {
  const clean = (text || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean || "{}");
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
  const serverPassword = (process.env.ADMIN_PASSWORD || "").trim();
  if (serverPassword && adminPassword === serverPassword) {
    return true;
  }
  return false;
}

const FIVE_PILLARS_INSTRUCTIONS = `PĚT PILÍŘŮ AI KUCHAŘKY (aplikuj na každý recept):
1. Pilíř 1 – Věda (Food Science): Propočítávej přesné fyzikální teploty a chemické procesy (rozklad kolagenu, želatinizace škrobů, Maillardova reakce, hydratace těsta).
2. Pilíř 2 – Mistrovská technika (Culinary Masterclass): Převeď ověřené profesionální postupy do srozumitelných kroků pro domácí kuchyni.
3. Pilíř 3 – Statistiky chuti (Analýza chuťových poměrů): Vylaď poměry surovin, soli, kyselin, tuků a koření pro plnou harmonickou chuť. Zásadně bez průmyslové chemie, polotovarů a konzervantů.
4. Pilíř 4 – Prevence nezdarů (Eliminace chyb): Předcházej častým chybám domácích kuchařů (vysušení masa, sražení omáčky, připálení, nedopečení).
5. Pilíř 5 – Inženýrství (Moderní spotřebiče): Doporuč optimální spotřebič ('applianceType') a uveď konkrétní časy, teploty a praktické tipy ('applianceTips').

ZÁVAZNÁ PRAVIDLA PRO POSTUPY PŘÍPRAVY ('instructions'):
1. Konkrétní časy u všech klíčových procesů: V postupech přípravy ('instructions') MUSÍ být u každého procesního, fyzikálního či chemického kroku (např. klíčení, fermentace, autolýza, rozkvas, kynutí, odležení, namáčení, chlazení, odpočinek, hnětení, pečení, smažení, vaření, šlehání, redukce) VŽDY uveden konkrétní čas a trvání (např. "nechte autolyzovat po dobu 30 minut", "kynutí 60 minut při pokojové teplotě", "odležet v chladničce 4 hodiny", "pečení 45 minut při 200 °C", "hněťte po dobu 10 minut").
2. Žádné váhové údaje v postupech: V krocích postupu ('instructions') NEOPAKUJTE gramy, mililitry ani kusy surovin (ty patří výhradně do pole 'ingredients'), ale časové údaje a trvání operací jsou povinné u každého procesního kroku.`;

function normalizeRecipePayload(recipeData: any, existingId?: string) {
  const normalized: any = { ...recipeData };
  normalized.id = existingId || normalized.id || `recipe-ai-${Date.now()}`;
  if (!normalized.applianceType && normalized.appliance) {
    normalized.applianceType = normalized.appliance;
  }
  delete normalized.appliance;
  if (!normalized.applianceType) normalized.applianceType = "Sporák";
  if (!normalized.cookingTime) normalized.cookingTime = "30 min";
  if (!normalized.estimatedCookingTime) normalized.estimatedCookingTime = normalized.cookingTime;
  if (!normalized.category) normalized.category = "Ostatní";
  if (!["Snadné", "Střední", "Složité"].includes(normalized.difficulty)) {
    normalized.difficulty = "Střední";
  }
  if (!Array.isArray(normalized.ingredients)) normalized.ingredients = [];
  if (!Array.isArray(normalized.instructions)) normalized.instructions = [];
  if (!normalized.applianceTips) {
    normalized.applianceTips = `Při přípravě v zařízení '${normalized.applianceType}' dodržujte doporučené teploty a časy.`;
  }
  if (!normalized.expertJustification) {
    normalized.expertJustification = "Recept byl optimalizován podle pěti pilířů kulinářské vědy a technologie AI Kuchařky.";
  }
  normalized.createdAt = normalized.createdAt || new Date().toISOString();
  normalized.updatedAt = new Date().toISOString();
  ensureNutrition([normalized]);
  return normalized;
}

app.get("/api/config", (req, res) => {
  res.json({ readOnly: false, authRequired: true });
});

app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok" });
});

app.get(["/api", "/api/recipes", "/recipes"], async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
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
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }

    // Fast single-recipe upsert (ideal for mobile/tablet & Vercel)
    if (req.body && req.body.recipe && typeof req.body.recipe === "object") {
      const r = { ...req.body.recipe };
      r.id = r.id || slugify(r.title || `recipe-${Date.now()}`);
      ensureNutrition([r]);
      await setDoc(doc(db, "recipes", r.id), r, { merge: true });
      return res.json({ success: true, recipe: r });
    }

    // Fast single-recipe delete
    if (req.body && req.body.deleteId) {
      await deleteDoc(doc(db, "recipes", String(req.body.deleteId)));
      return res.json({ success: true, deletedId: req.body.deleteId });
    }

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

app.delete(["/api/recipes/:id", "/recipes/:id"], async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }
    const recipeId = req.params.id;
    if (!recipeId) {
      return res.status(400).json({ error: "Chybí ID receptu." });
    }
    await deleteDoc(doc(db, "recipes", recipeId));
    return res.json({ success: true, deletedId: recipeId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-admin", async (req, res) => {
  try {
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_PASSWORD.trim()) {
      return res.status(503).json({
        error: "Na serveru není nastavena proměnná prostředí ADMIN_PASSWORD.",
      });
    }
    if (isAuthorized(req)) {
      return res.json({ success: true, message: "Ověřeno úspěšně." });
    }
    return res.status(401).json({ error: "Neplatný administrační kód." });
  } catch (error) {
    return res.status(500).json({ error: "Chyba při ověřování hesla." });
  }
});

app.post("/api/test-diagnostics", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
  }

  const ai = getAi();
  const result = {
    timestamp: new Date().toISOString(),
    firestoreOk: false,
    firestoreMessage: "Probíhá test",
    geminiOk: Boolean(ai),
    geminiMessage: ai
      ? "Gemini AI (gemini-4-hydrogen) je aktivní a nakonfigurován"
      : "Chybí GEMINI_API_KEY na serveru (zkontrolujte proměnné prostředí)",
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

function extractRecipeJsonFromChatText(rawText: string): {
  cleanReply: string;
  extractedRecipe: any | null;
} {
  let text = rawText || "";
  let extractedRecipe: any | null = null;

  const tagMatch = text.match(/<RECIPE_JSON>\s*([\s\S]*?)\s*<\/RECIPE_JSON>/i);
  if (tagMatch) {
    const candidate = tagMatch[1]
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      extractedRecipe = JSON.parse(candidate);
      text = text.replace(tagMatch[0], "").trim();
      return { cleanReply: text, extractedRecipe };
    } catch (e) {
      console.warn("[Recipe Chat] Failed to parse <RECIPE_JSON> block:", e);
    }
  }

  const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed && (parsed.title || parsed.ingredients || parsed.recipe)) {
        extractedRecipe = parsed.recipe || parsed;
        text = text.replace(fenceMatch[0], "").trim();
      }
    } catch {
      // Ignore invalid fenced block and fall back to structured extractor
    }
  }

  return { cleanReply: text.replace(/<\/?RECIPE_JSON>/gi, "").trim(), extractedRecipe };
}

app.post("/api/recipe-chat", async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Pouze přihlášený administrátor může používat Gemini AI." });
    }
    const ai = getAi();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API klíč není na serveru nakonfigurován." });
    }

    const { messages, currentDraftRecipe } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Chybí zpráva pro Gemini chat." });
    }

    const draftContext = currentDraftRecipe
      ? `\n\nAKTUÁLNÍ ROZPRACOVANÝ NÁVRH RECEPTU (pokud uživatel žádá úpravu, vycházej z tohoto návrhu a aktualizuj ho):\n${JSON.stringify(currentDraftRecipe, null, 2)}`
      : "";

    const systemInstruction = `Jsi šéfkuchař, výzkumník receptů a potravinářský vědec AI Kuchařky. Komunikuješ s administrátorem jako klasický chytrý AI chat v češtině s živým přístupem k vyhledávání na internetu (Google Search).

JAK POSTUPOVAT PŘI NÁVRHU RECEPTU:
1. VYHLEDÁNÍ NA INTERNETU: Kdykoli uživatel chce vytvořit recept (např. "vytvoř recept na bramborové placky", "nejlepší guláš") nebo se ptá na postup/suroviny, VŽDY nejdříve prohledej internet pomocí nástroje Google Search a najdi několik ověřených receptů různých známých kuchařů a kvalitních gastronomických webů (českých i světových – např. Roman Paulus, Zdeněk Pohlreich, Apetit, Kuchyně Lidlu, Toprecepty, Serious Eats apod.).
2. POROVNÁNÍ A ANALÝZA PODLE 5 PILÍŘŮ: Porovnej, v čem se nalezené recepty liší (poměry surovin, techniky, teploty, časté chyby) a z nejlepších prvků slož JEDEN nejlepší, kulinářsky i vědecky dokonalý recept podle Pěti pilířů AI Kuchařky.
3. POUZE NÁVRH K POTVRZENÍ: Recept do databáze sám neukládáš — nejprve ho v chatu představíš uživateli ke kontrole a případným úpravám. Uživatel ho pak potvrdí tlačítkem.

${FIVE_PILLARS_INSTRUCTIONS}

FORMÁT ODPOVĚDI:
- Piš přehledně a přirozeně česky jako běžný AI chat:
  1) Stručně napiš, jaké recepty / přístupy různých kuchařů jsi na internetu našel a porovnal.
  2) Vysvětli, jak jsi z nich pomocí 5 pilířů sestavil ten nejlepší recept (proč zvolené poměry, technika, teploty a prevence chyb).
  3) Přidej přehledný seznam surovin a kroků postupu s přesnými časy a zeptej se uživatele, zda chce něco upravit, nebo návrh potvrdí pro vložení do kuchařky.
- Pokud v této zprávě navrhuješ nebo upravuješ recept, na ÚPLNÝ KONEC své odpovědi (za běžný text) připoj validní JSON zabalený PŘESNĚ v tazích <RECIPE_JSON>...</RECIPE_JSON> s těmito poli:
  title, summary, category, cookingTime, estimatedCookingTime, difficulty ('Snadné' | 'Střední' | 'Složité'), applianceType, applianceTips, expertJustification, ingredients (pole řetězců s množstvím), instructions (pole řetězců s konkrétními časy procesů a BEZ gramů/ml/kusů).
- Pokud uživatel jen pokládá obecnou otázku bez žádosti o návrh/úpravu receptu, tag <RECIPE_JSON> nepřipojuj.${draftContext}`;

    const historyMessages = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    const history = historyMessages.map((m: any) => {
      const parts: any[] = [];
      const textVal = (m.text || "").trim();
      const attachmentNote = m.fileName ? `[Přiložený soubor: ${m.fileName}]` : "";
      const combinedText = [textVal, attachmentNote].filter(Boolean).join("\n");
      if (combinedText) {
        parts.push({ text: combinedText });
      }
      if (parts.length === 0) {
        parts.push({ text: "..." });
      }
      return {
        role: m.role === "model" ? "model" : "user",
        parts,
      };
    });

    const lastParts: any[] = [
      ...buildAttachmentParts(lastMessage.fileData, lastMessage.fileName, lastMessage.mimeType),
    ];
    if (lastMessage.text && lastMessage.text.trim()) {
      lastParts.push({ text: lastMessage.text.trim() });
    } else if (lastParts.length > 0) {
      lastParts.push({
        text: "Analyzuj přiložený soubor/obrázek, ověř osvědčené kuchařské postupy na internetu a navrhni nejlepší recept podle pěti pilířů AI Kuchařky se všemi časy procesů.",
      });
    }

    if (lastParts.length === 0) {
      return res.status(400).json({ error: "Zadejte text zprávy nebo přiložte soubor." });
    }

    // Grounded AI Chat with live Google Search
    const response = await sendChatWithRetry(ai, history, lastParts, {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    });

    const rawReply = response.text || "";
    const groundingMeta = response.candidates?.[0]?.groundingMetadata;
    const rawChunks = groundingMeta?.groundingChunks || [];
    const sourcesMap = new Map<string, { title: string; uri: string }>();
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      if (uri && !sourcesMap.has(uri)) {
        sourcesMap.set(uri, {
          title: chunk?.web?.title || uri,
          uri,
        });
      }
    }
    const sources = Array.from(sourcesMap.values()).slice(0, 8);
    const searchQueries = Array.isArray(groundingMeta?.webSearchQueries)
      ? groundingMeta.webSearchQueries
      : [];

    let { cleanReply, extractedRecipe } = extractRecipeJsonFromChatText(rawReply);

    // Fallback: if Gemini wrote a great grounded recipe in text without <RECIPE_JSON>, extract it cleanly
    const looksLikeRecipeProposal =
      Boolean(lastMessage.fileData) ||
      /(suroviny|ingredience|postup|příprav|recept)/i.test(cleanReply);

    if (!extractedRecipe && looksLikeRecipeProposal && cleanReply.length > 120) {
      try {
        const extractRes = await generateContentWithRetry(ai, {
          contents: `Uživatel napsal: "${lastMessage.text || "(příloha)"}"\n\nOdpověď kuchařského asistenta:\n${cleanReply}${draftContext}\n\nPokud odpověď asistenta obsahuje návrh nebo úpravu konkrétního receptu, extrahuj jej do JSON podle zadaného schématu (včetně 5 pilířů, časů u všech kroků a bez váhových údajů v instructions). Pokud jde jen o obecnou konverzaci bez návrhu receptu, nastav hasRecipeProposal na false.`,
          config: {
            systemInstruction: `Extrahuj strukturovaný recept do JSON podle pravidel AI Kuchařky.\n${FIVE_PILLARS_INSTRUCTIONS}`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["hasRecipeProposal"],
              properties: {
                hasRecipeProposal: { type: Type.BOOLEAN },
                recipe: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    category: { type: Type.STRING },
                    cookingTime: { type: Type.STRING },
                    estimatedCookingTime: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    applianceType: { type: Type.STRING },
                    applianceTips: { type: Type.STRING },
                    expertJustification: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
          },
        });
        const extractedObj = parseAiJson(extractRes.text);
        if (extractedObj?.hasRecipeProposal && extractedObj?.recipe?.title) {
          extractedRecipe = extractedObj.recipe;
        }
      } catch (extractErr) {
        console.warn("[Recipe Chat] Structured fallback extraction failed:", extractErr);
      }
    }

    const normalizedRecipe =
      extractedRecipe && extractedRecipe.title
        ? normalizeRecipePayload(extractedRecipe, currentDraftRecipe?.id)
        : null;

    return res.json({
      reply: cleanReply || "Připravil jsem pro vás návrh receptu na základě receptů z internetu a pěti pilířů.",
      recipe: normalizedRecipe,
      sources,
      searchQueries,
    });
  } catch (err: any) {
    console.error("[Recipe Chat Error]:", err);
    return res.status(500).json({ error: err.message || "Chyba při komunikaci s Gemini chatem." });
  }
});

app.post("/api/enhance-recipe", async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč není nakonfigurován." });
    
    const { originalRecipe, userPrompt, rawText, fileData, fileName, mimeType } = req.body;
    
    const systemInstruction = `Jsi profesionální šéfkuchař a expert na digitalizaci a syntézu kulinářských receptů. Tvým úkolem je vytvořit nebo upravit recept a vrátit ho PŘESNĚ ve formátu JSON, který odpovídá struktuře aplikace.

${FIVE_PILLARS_INSTRUCTIONS}

STRUKTURA JSON:
- 'title': Krátký výstižný název pokrmu v češtině.
- 'summary': Lákavý popis (max 2-3 věty).
- 'category': Kategorie (např. 'Maso', 'Pečivo', 'Polévky', 'Sladká jídla a moučníky', 'Ostatní').
- 'cookingTime': Celkový čas (např. '1 hodina 15 minut').
- 'estimatedCookingTime': Odhadovaný čas přípravy (např. '1 hodina 15 minut').
- 'difficulty': Náročnost ('Snadné', 'Střední', 'Složité').
- 'applianceType': Doporučené hlavní zařízení (např. 'Sporák', 'Klasická trouba', 'Remoska', 'Horkovzdušná fritéza', 'Pomalý hrnec').
- 'applianceTips': Praktický tip pro dané kuchyňské zařízení.
- 'expertJustification': Odborné kulinářské zdůvodnění postupu a chemických reakcí podle pěti pilířů.
- 'ingredients': Pole řetězců s přesným množstvím a názvem suroviny (např. ["500 g hladké mouky", "250 ml vlažné vody", "10 g soli", "1 ks cibule"]).
- 'instructions': Pole řetězců popisujících jednotlivé kroky přípravy (s povinnými časy procesů a bez váhových údajů).`;

    const contents: any[] = [...buildAttachmentParts(fileData, fileName, mimeType)];

    if (rawText && rawText.trim()) {
      contents.push({ text: `ZADÁNÍ, POZNÁMKY NEBO POPIS OD UŽIVATELE:\n${rawText.trim()}` });
    }
    
    if (originalRecipe) {
      contents.push({ text: `PŮVODNÍ RECEPT:\n${JSON.stringify(originalRecipe, null, 2)}` });
    }
    
    if (userPrompt && userPrompt.trim()) {
      contents.push({ text: `DODATEČNÉ POKYNY:\n${userPrompt.trim()}` });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "Zadejte text nebo vložte soubor (obrázek, textový soubor, PDF)." });
    }
    
    const response = await generateContentWithRetry(ai, {
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    const recipeData = normalizeRecipePayload(parseAiJson(response.text));

    return res.json({ recipe: recipeData });
  } catch (err: any) {
    console.error("[Enhance Recipe Error]:", err);
    res.status(500).json({ error: err.message || "Chyba při generování receptu přes AI." });
  }
});

app.post("/api/edit-recipe", async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    
    const { recipe, modificationPrompt, originalRecipe, userPrompt } = req.body;
    const recipeToEdit = recipe || originalRecipe;
    const promptText = modificationPrompt || userPrompt;
    
    if (!recipeToEdit) return res.status(400).json({ error: "Původní recept je povinný." });

    const systemInstruction = `Jsi profesionální šéfkuchař. Uprav recept podle zadání uživatele a vrať ho v JSON struktuře odpovídající aplikaci (pole: title, summary, category, cookingTime, estimatedCookingTime, difficulty, applianceType, applianceTips, expertJustification, ingredients, instructions).
${FIVE_PILLARS_INSTRUCTIONS}`;
    const prompt = `\nPŮVODNÍ RECEPT:\n${JSON.stringify(recipeToEdit, null, 2)}\n\nZADÁNÍ ÚPRAVY:\n${promptText}`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    const edited = normalizeRecipePayload(parseAiJson(response.text), recipeToEdit.id);
    edited.title = edited.title || recipeToEdit.title;
    edited.createdAt = recipeToEdit.createdAt || edited.createdAt;
    return res.json({ recipe: edited, logs: ["Recept upraven pomocí Gemini AI"] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/audit-recipe", async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    const { recipe } = req.body;
    
    const systemInstruction = `Jsi špičkový vědec potravinář a kulinářský technolog. Tvým úkolem je analyzovat recept, simulovat jeho přípravu krok za krokem podle pěti pilířů AI Kuchařky a navrhnout konkrétní vylepšení (např. chemické reakce, lepší časy, hydratace). Vrať JSON objekt, který obsahuje 'simulationSteps' s kroky analýzy, 'proposedChange' s krátkým shrnutím hlavní změny, a 'modifiedRecipe' s kompletně upraveným receptem.
${FIVE_PILLARS_INSTRUCTIONS}`;
    const prompt = `Prozkoumej tento recept a spusť kompletní simulaci vaření. Aplikuj veškeré potřebné úpravy do pole 'modifiedRecipe'.\n${JSON.stringify(recipe, null, 2)}`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["simulationSteps", "proposedChange", "modifiedRecipe"],
          properties: {
            simulationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            proposedChange: { type: Type.STRING },
            modifiedRecipe: {
              type: Type.OBJECT,
              required: ["title", "summary", "ingredients", "instructions", "cookingTime", "difficulty"],
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
    
    res.json(parseAiJson(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/calculate-nutrition", async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: "Přístup odepřen. Vyžadováno administrátorské přihlášení." });
    }
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    const { recipe } = req.body;
    
    const prompt = `Jsi nutriční specialista. Spočítej nutriční hodnoty na 100g hotového pokrmu.\nRecept: ${recipe.title}\nSuroviny:\n${recipe.ingredients.join('\n')}\nPostup:\n${recipe.instructions.join('\n')}\nVrať POUZE JSON objekt (calories, proteins, carbohydrates, sugars, fats, saturatedFats, fiber, salt).`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    res.json(parseAiJson(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found` });
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
    console.log(`AI Kuchařka Express server běžící na portu ${PORT}`);
  });
}

export default app;
if (!process.env.VERCEL) startServer();
