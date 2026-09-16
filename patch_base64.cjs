const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

// Strip data URL prefix if present
const oldInline = `    if (fileData) {
       contents.push({
         inlineData: {
           data: fileData,
           mimeType: mimeType || "image/jpeg"
         }
       });
    }`;
    
const newInline = `    if (fileData) {
       const base64Data = fileData.includes("base64,") ? fileData.split("base64,")[1] : fileData;
       contents.push({
         inlineData: {
           data: base64Data,
           mimeType: mimeType || "image/jpeg"
         }
       });
    }`;

content = content.replace(oldInline, newInline);
fs.writeFileSync('api/index.ts', content);
