const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

// 1. Add parseAiJson function
const parseFunc = `
function parseAiJson(text) {
  const clean = (text || "").replace(/\`\`\`(?:json)?/gi, "").replace(/\`\`\`/g, "").trim();
  return JSON.parse(clean || "{}");
}
`;

// Insert it before the first use, maybe after getAuthDetails
const anchorAuth = `function getAuthDetails(req: express.Request) {`;
content = content.replace(anchorAuth, parseFunc + '\n' + anchorAuth);

// 2. Replace all JSON.parse(response.text || "{}") with parseAiJson(response.text)
// In /api/enhance-recipe
content = content.replace(
  'const recipeData = JSON.parse(response.text || "{}");',
  'const recipeData = parseAiJson(response.text);'
);

// In /api/edit-recipe
content = content.replace(
  'const edited = JSON.parse(response.text || "{}");',
  'const edited = parseAiJson(response.text);'
);

// In /api/audit-recipe
content = content.replace(
  'res.json(JSON.parse(response.text || "{}"));',
  'res.json(parseAiJson(response.text));'
);

// In /api/calculate-nutrition
content = content.replace(
  'res.json(JSON.parse(response.text || "{}"));',
  'res.json(parseAiJson(response.text));'
);

fs.writeFileSync('api/index.ts', content);
