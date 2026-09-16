const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

// 1. Update generateContentWithRetry
const oldModels = 'const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];';
const newModels = 'const modelsToTry = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];';
content = content.replace(oldModels, newModels);

// Treat 404 as fallback condition too
const oldCondition = 'const isQuotaError = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Quota");';
const newCondition = 'const isQuotaError = err?.status === 429 || err?.status === 404 || err?.message?.includes("429") || err?.message?.includes("404") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Quota");';
content = content.replace(oldCondition, newCondition);

// 2. Update test-diagnostics
content = content.replace(/gemini-2\.5-pro/g, 'gemini-3.1-pro-preview');

fs.writeFileSync('api/index.ts', content);
