const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

const oldPrompt = `    const systemInstruction = "Jsi vědec potravinář a pekařský technolog...";
    const prompt = \`Prozkoumej tento recept a spusť kompletní simulaci vaření.\\n\${JSON.stringify(recipe, null, 2)}\`;`;

const newPrompt = `    const systemInstruction = "Jsi špičkový vědec potravinář a kulinářský technolog. Tvým úkolem je analyzovat recept, simulovat jeho přípravu krok za krokem a navrhnout konkrétní vylepšení (např. chemické reakce, lepší časy, hydratace). Vrať JSON objekt, který obsahuje 'simulationSteps' s kroky analýzy, 'proposedChange' s krátkým shrnutím hlavní změny, a 'modifiedRecipe' s kompletně upraveným receptem.";
    const prompt = \`Prozkoumej tento recept a spusť kompletní simulaci vaření. Aplikuj veškeré potřebné úpravy do pole 'modifiedRecipe'.\\n\${JSON.stringify(recipe, null, 2)}\`;`;

content = content.replace(oldPrompt, newPrompt);
fs.writeFileSync('api/index.ts', content);
console.log("Patched prompt");
