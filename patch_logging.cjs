const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const oldCode = `        if (isQuotaError) {
          console.warn(\`[Gemini] Model \${modelName} hit quota limit, switching to next model...\`);
          break; // Break the retry loop for this model, move to next model
        }
        if (i === retries - 1) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw err;
          break;
        }`;

const newCode = `        console.error(\`[Gemini] Error with model \${modelName}:\`, err.message);
        if (isQuotaError) {
          console.warn(\`[Gemini] Model \${modelName} hit quota limit, switching to next model...\`);
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw err;
          break; // Break the retry loop for this model, move to next model
        }
        if (i === retries - 1) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw err;
          break;
        }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('api/index.ts', content);
