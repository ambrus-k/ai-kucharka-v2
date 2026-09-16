const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Hide chrono delete button
let btn1 = `<button
                                      id={\`btn-delete-recipe-chrono-\${recipe.id}\`}`;
content = content.replace(btn1, `{!isReadOnly && (${btn1}`);

// Hide alpha delete button
let btn2 = `<button
                                      id={\`btn-delete-recipe-alpha-\${recipe.id}\`}`;
content = content.replace(btn2, `{!isReadOnly && (${btn2}`);

// Close them (the trash icon is the same for both)
let trashClose = `<Trash2 className="h-3 w-3" />
                                    </button>`;
let trashCloseReplace = `<Trash2 className="h-3 w-3" />
                                    </button>)}`;
content = content.replaceAll(trashClose, trashCloseReplace);

fs.writeFileSync('src/App.tsx', content);
