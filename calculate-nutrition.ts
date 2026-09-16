import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const DATA_DIR = path.join(process.cwd(), "data", "recipes");
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const nutritionSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER, description: "kcal per 100g" },
    proteins: { type: Type.NUMBER, description: "g per 100g" },
    carbohydrates: { type: Type.NUMBER, description: "g per 100g" },
    sugars: { type: Type.NUMBER, description: "g per 100g" },
    fats: { type: Type.NUMBER, description: "g per 100g" },
    saturatedFats: { type: Type.NUMBER, description: "g per 100g" },
    fiber: { type: Type.NUMBER, description: "g per 100g" },
    salt: { type: Type.NUMBER, description: "g per 100g" }
  },
  required: ["calories", "proteins", "carbohydrates", "sugars", "fats", "saturatedFats", "fiber", "salt"]
};

async function processRecipes() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${files.length} recipes to process.`);

  let processed = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      
      const ingredientsList = data.ingredients.join("\\n");
      const prompt = `Odhadni přesné nutriční hodnoty na 100 gramů hotového jídla pro tento recept.\\nNázev: ${data.title}\\nIngredience:\\n${ingredientsList}\\n\\nVrať pouze JSON podle schématu, žádný další text. Hodnoty by měly být realistické a vypočítané na základě běžných tabulek.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: nutritionSchema,
          temperature: 0.1
        }
      });

      // FIX: text is a property, not a function!
      const text = response.text;
      if (!text) throw new Error("No response text");
      
      const nutrition = JSON.parse(text);
      data.nutritionPer100g = nutrition;
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      processed++;
      console.log(`[${processed}/${files.length}] Zpracován recept: ${data.title} (${nutrition.calories} kcal)`);
      
      // sleep a bit to avoid rate limits
      await new Promise(r => setTimeout(r, 800));
    } catch (err: any) {
      console.error(`Chyba u souboru ${file}:`, err.message);
    }
  }
  console.log(`Hotovo! Zpracováno receptů: ${processed}`);
}

processRecipes();
