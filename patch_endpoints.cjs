const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const enhanceAnchor = 'app.post("/api/enhance-recipe", async (req, res) => {';
const editAnchor = 'app.post("/api/audit-recipe", async (req, res) => {';

// Extract everything before /api/enhance-recipe and after /api/audit-recipe
const parts = content.split(enhanceAnchor);
const beforeEnhance = parts[0];
const parts2 = parts[1].split(editAnchor);
const afterEdit = parts2[1];

const newEndpoints = `app.post("/api/enhance-recipe", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč není nakonfigurován." });
    
    const { originalRecipe, userPrompt, rawText, fileData, mimeType } = req.body;
    
    const systemInstruction = \`Jsi profesionální šéfkuchař a expert na digitalizaci receptů. Tvým úkolem je vytvořit nebo upravit recept a vrátit ho PŘESNĚ ve formátu JSON, který odpovídá struktuře aplikace. Důležité:
- Pokud dostaneš fotku nebo text, vytvoř z nich kompletní recept.
- 'title': Krátký výstižný název.
- 'summary': Lákavý popis (max 2-3 věty).
- 'ingredients': Pole stringů s přesným množstvím.
- 'instructions': Pole stringů popisujících kroky. U každého procesního kroku VŽDY uváděj konkrétní čas a trvání (např. 'pečte 45 minut při 200°C'). Žádné gramy v postupu.
- 'cookingTime': Celkový čas (např. '1 hodina 30 minut').
- 'difficulty': Náročnost ('Snadné', 'Střední', 'Těžké').
- 'category': Kategorie (např. 'Hlavní chody', 'Dezerty', 'Polévky', 'Přílohy').\`;

    let contents = [];
    
    if (fileData) {
       contents.push({
         inlineData: {
           data: fileData,
           mimeType: mimeType || "image/jpeg"
         }
       });
    }

    if (rawText) {
      contents.push({ text: \`ZADÁNÍ NEBO TEXT RECEPTU:\\n\${rawText}\` });
    }
    
    if (originalRecipe) {
      contents.push({ text: \`PŮVODNÍ RECEPT:\\n\${JSON.stringify(originalRecipe, null, 2)}\` });
    }
    
    if (userPrompt) {
      contents.push({ text: \`DODATEČNÝ POŽADAVEK:\\n\${userPrompt}\` });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "Zadejte text, vložte obrázek nebo původní recept." });
    }
    
    const response = await generateContentWithRetry(ai, {
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/edit-recipe", async (req, res) => {
  if (process.env.VERCEL) return res.status(403).json({ error: "Aplikace je v režimu pouze pro čtení." });
  try {
    const ai = getAi();
    if (!ai) return res.status(503).json({ error: "Gemini API klíč chybí." });
    
    const { recipe, modificationPrompt, originalRecipe, userPrompt } = req.body;
    const recipeToEdit = recipe || originalRecipe;
    const promptText = modificationPrompt || userPrompt;
    
    if (!recipeToEdit) return res.status(400).json({ error: "Původní recept je povinný." });

    const systemInstruction = \`Jsi profesionální šéfkuchař. Uprav recept podle zadání uživatele a vrať ho v JSON struktuře odpovídající aplikaci.
Pamatuj na pravidlo: U každého procesního kroku v 'instructions' VŽDY uváděj konkrétní čas a trvání. Žádné váhové údaje v postupu.\`;
    const prompt = \`\\nPŮVODNÍ RECEPT:\\n\${JSON.stringify(recipeToEdit, null, 2)}\\n\\nZADÁNÍ ÚPRAVY:\\n\${promptText}\`;
    
    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/audit-recipe", async (req, res) => {`;

fs.writeFileSync('api/index.ts', beforeEnhance + newEndpoints + afterEdit);
