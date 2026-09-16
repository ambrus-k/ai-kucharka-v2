const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.listModels({});
  // Log models that contain flash
  for await (const model of response) {
    if (model.name.includes("flash")) {
      console.log(model.name);
    }
  }
}
run();
