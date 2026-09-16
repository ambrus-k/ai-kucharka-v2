const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const resp = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "ok" });
    console.log("2.5 flash ok");
  } catch(e) {}
  try {
    const resp = await ai.models.generateContent({ model: "gemini-1.5-flash-latest", contents: "ok" });
    console.log("1.5 flash latest ok");
  } catch(e) { console.error(e.message) }
}
run();
