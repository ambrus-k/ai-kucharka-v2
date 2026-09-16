const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const oldFunc = `async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 3) {
  // Multi-model fallback sequence
  const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash"];
  
  for (const modelName of modelsToTry) {
    const currentConfig = { ...config, model: modelName };
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(currentConfig);
      } catch (err: any) {
        const isQuotaError = err?.status === 429 || err?.status === 404 || err?.message?.includes("429") || err?.message?.includes("404") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Quota");
        console.error(\`[Gemini] Error with model \${modelName}:\`, err.message);
        if (isQuotaError) {
          console.warn(\`[Gemini] Model \${modelName} hit quota limit, switching to next model...\`);
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            throw new Error("Všechny dostupné AI modely vyčerpaly svou kvótu. Zkuste to prosím o něco později. (" + err.message + ")");
          }
          break; // Break the retry loop for this model, move to next model
        }
        if (i === retries - 1) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            throw new Error("Při komunikaci s AI modelem došlo k chybě: " + err.message);
          }
          break;
        }
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  }
  throw new Error("Všechny AI modely selhaly na limit kvóty nebo interní chybu.");
}`;

const newFunc = `async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 2) {
  const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    const currentConfig = { ...config, model: modelName };
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(currentConfig);
      } catch (err: any) {
        lastError = err;
        console.error(\`[Gemini] Error with model \${modelName} (attempt \${i+1}):\`, err.message);
        
        const status = err?.status || err?.response?.status;
        const msg = (err?.message || "").toLowerCase();
        
        const isFatalForModel = status === 400 || status === 404 || msg.includes("not found") || msg.includes("not supported");
        const isQuota = status === 429 || msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota");

        if (isFatalForModel || isQuota) {
          console.warn(\`[Gemini] Model \${modelName} failed with \${isQuota ? 'quota' : 'fatal'} error, switching to next model immediately...\`);
          break; // Move to the next model in modelsToTry
        }

        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
      }
    }
  }
  
  throw new Error("Všechny dostupné AI modely selhaly. Poslední chyba: " + (lastError?.message || "Neznámá chyba"));
}`;

if (content.includes('async function generateContentWithRetry(ai: GoogleGenAI, config: any, retries = 3) {')) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync('api/index.ts', content);
  console.log('Patched fallback logic');
} else {
  console.error('Could not find old func');
}
