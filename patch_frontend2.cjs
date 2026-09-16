const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Hide delete buttons in list
content = content.replace(
  /<button\n\s+id={`btn-delete-recipe-chrono-\${recipe.id}`}/g,
  '{!isReadOnly && (<button\n                                      id={`btn-delete-recipe-chrono-${recipe.id}`}'
);
content = content.replace(
  /<Trash2 className="h-3 w-3" \/>\n\s+<\/button>/g,
  '<Trash2 className="h-3 w-3" />\n                                    </button>)}'
);

// We have two buttons (chrono and alpha). Wait, let's just do it with a function for precise replacement.
