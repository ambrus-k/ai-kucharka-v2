const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');
content = content.replace(
  'import { GoogleGenAI, Type } from "@google/genai";',
  'import { GoogleGenAI, Type } from "@google/genai";\nimport { query, limit } from "firebase/firestore";\n\nfunction getAi() {\n  return process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;\n}\n\nasync function generateContentWithRetry(ai, config, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      return await ai.models.generateContent(config);\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(res => setTimeout(res, 1000 * (i + 1)));\n    }\n  }\n}\n'
);
fs.writeFileSync('api/index.ts', content);
