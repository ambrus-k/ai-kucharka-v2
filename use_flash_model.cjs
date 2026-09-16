const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

// 1. Update fallback sequence in generateContentWithRetry
content = content.replace(
  'const modelsToTry = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];',
  'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];'
);

// 2. Update diagnostics endpoint to test Flash directly
// We need to rewrite the diagnostic test slightly to reflect this.
const diagOld = `        const respPro = await ai.models.generateContent({ model: "gemini-3.1-pro-preview", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        if (respPro.text && respPro.text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Pro aktivní a funkční";
        }
      } catch (ePro: any) {
        const isQuotaError = ePro?.status === 429 || ePro?.status === 404 || ePro?.message?.includes("429") || ePro?.message?.includes("404") || ePro?.message?.includes("RESOURCE_EXHAUSTED") || ePro?.message?.includes("Quota");
        if (isQuotaError) {
          try {
            const respFlash = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
            if (respFlash.text && respFlash.text.toLowerCase().includes("ok")) {
              result.geminiOk = true;
              result.geminiMessage = "Gemini Pro vyčerpal kvótu (běží na záložním Gemini Flash)";
            } else {
              result.geminiMessage = "Gemini Flash neodpověděl";
            }
          } catch (eFlash: any) {
            result.geminiMessage = "Oba modely selhaly (Pro kvóta, Flash chyba): " + eFlash.message;
          }
        } else {
          result.geminiMessage = "Chyba Gemini Pro: " + ePro.message;
        }
      }`;

const diagNew = `        const respFlash = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Odpověz slovem ok", config: { maxOutputTokens: 10 } });
        if (respFlash.text && respFlash.text.toLowerCase().includes("ok")) {
          result.geminiOk = true;
          result.geminiMessage = "Gemini Flash (gemini-2.5-flash) aktivní a plně funkční";
        } else {
          result.geminiMessage = "Gemini Flash neodpověděl";
        }
      } catch (eFlash: any) {
        result.geminiMessage = "Chyba Gemini Flash API: " + eFlash.message;
      }`;

content = content.replace(diagOld, diagNew);

fs.writeFileSync('api/index.ts', content);
