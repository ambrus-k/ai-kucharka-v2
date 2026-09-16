const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const oldSchema = `        responseSchema: {
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
        }`;

const newSchema = `        responseSchema: {
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
        }`;

if (content.includes('responseSchema: {')) {
  content = content.replace(oldSchema, newSchema);
  fs.writeFileSync('api/index.ts', content);
  console.log("Patched api/index.ts schema");
}
