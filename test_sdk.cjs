const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "Řekni mi něco zajímavého" }
      ]
    });
    console.log("Success text part:", resp.text);
  } catch (err) {
    console.error("Error text part:", err.message);
  }

  try {
    // try to mimic the image call with a dummy base64
    const resp2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", mimeType: "image/png" } },
        { text: "What is this image?" }
      ]
    });
    console.log("Success image part:", resp2.text);
  } catch (err) {
    console.error("Error image part:", err.message);
  }
}
run();
