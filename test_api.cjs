const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Odpověz slovem ok"
    });
    console.log("Response:", resp.text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
