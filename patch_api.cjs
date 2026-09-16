const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf-8');

// 1. Add /api/config
const configEndpoint = `
app.get("/api/config", (req, res) => {
  res.json({ readOnly: !!process.env.VERCEL });
});
`;
content = content.replace('app.get("/api/health"', configEndpoint + '\napp.get("/api/health"');

// 2. Add Read-Only checks to mutation endpoints
const readOnlyCheck = `
    if (process.env.VERCEL) {
      return res.status(403).json({ error: "Webová aplikace je v režimu pouze pro čtení. Správa receptů probíhá výhradně v AI Studiu." });
    }
`;

const endpointsToBlock = [
  'app.all(["/api", "/api/recipes", "/api/recipes/", "/recipes", "/recipes/"], async (req, res) => {\n  if (req.method !== "POST" && req.method !== "PUT") {\n    return res.status(405).json({ error: "Metoda nepovolena." });\n  }\n\n  try {',
  'app.post("/api/sync-codebase", async (req, res) => {\n  try {',
  'app.post("/api/sync-github", async (req, res) => {\n  try {',
  'app.post(["/api/enhance-recipe", "/api/enhance-recipe/", "/enhance-recipe", "/enhance-recipe/"], async (req, res) => {\n  try {',
  'app.post(["/api/edit-recipe", "/api/edit-recipe/", "/edit-recipe", "/edit-recipe/"], async (req, res) => {\n  try {',
  'app.post(["/api/audit-recipe", "/api/audit-recipe/", "/api/check-recipe", "/api/check-recipe/", "/audit-recipe", "/audit-recipe/", "/check-recipe", "/check-recipe/"], async (req, res) => {\n  try {',
  'app.post("/api/calculate-nutrition", async (req, res) => {\n  try {'
];

for (const ep of endpointsToBlock) {
  content = content.replace(ep, ep + readOnlyCheck);
}

fs.writeFileSync('api/index.ts', content);
console.log("api/index.ts patched successfully.");
