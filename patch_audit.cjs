const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `    try {
      const response = await fetch("/api/audit-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: selectedRecipe,
          adminPassword,
        }),`;

const newCode = `    try {
      // Use currently edited values so the audit reflects user modifications
      const recipeToAudit = {
        ...selectedRecipe,
        title: editTitle,
        summary: editSummary,
        ingredients: editIngredientsText.split("\\n").map(i => i.trim()).filter(Boolean),
        instructions: editInstructionsText.split("\\n").map(i => i.trim()).filter(Boolean),
        applianceTips: editApplianceTips,
        expertJustification: editExpertJustification,
        applianceType: editApplianceType,
        cookingTime: editCookingTime,
        estimatedCookingTime: editEstimatedCookingTime.trim() || editCookingTime || "20 min",
        difficulty: editDifficulty,
        category: editCategory,
      };

      const response = await fetch("/api/audit-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: recipeToAudit,
          adminPassword,
        }),`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/App.tsx', content);
console.log("Patched handleAuditRecipe");
