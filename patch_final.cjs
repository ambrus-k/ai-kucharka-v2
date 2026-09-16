const fs = require('fs');

let content = fs.readFileSync('api/index.ts', 'utf8');

// Update modelsToTry
const oldModels = 'const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];';
const newModels = 'const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];';
content = content.replace(oldModels, newModels);

// Update enhance-recipe response
const enhanceOldResp = `    const response = await generateContentWithRetry(ai, {
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));`;

const enhanceNewResp = `    const response = await generateContentWithRetry(ai, {
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    const recipeData = JSON.parse(response.text || "{}");
    recipeData.id = recipeData.id || \`gen-\${Date.now()}\`;
    if (!recipeData.estimatedCookingTime) {
      recipeData.estimatedCookingTime = recipeData.cookingTime || "30 min";
    }
    return res.json({ recipe: recipeData });`;

content = content.replace(enhanceOldResp, enhanceNewResp);

// Update edit-recipe response
const editOldResp = `    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    res.json(JSON.parse(response.text || "{}"));`;

const editNewResp = `    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    
    const edited = JSON.parse(response.text || "{}");
    edited.id = recipeToEdit.id || \`gen-\${Date.now()}\`;
    edited.title = recipeToEdit.title;
    return res.json({ recipe: edited, logs: ["Recept upraven pomocí Gemini AI"] });`;

content = content.replace(editOldResp, editNewResp);

fs.writeFileSync('api/index.ts', content);
