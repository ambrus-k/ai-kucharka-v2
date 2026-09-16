const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '{isAdmin && (\n                    <button\n                      onClick={navigateToEditRecipe}',
  '{!isReadOnly && isAdmin && (\n                    <button\n                      onClick={navigateToEditRecipe}'
);

fs.writeFileSync('src/App.tsx', content);
