const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add isReadOnly state and fetch logic
const stateHook = 'const [recipes, setRecipes] = useState<Recipe[]>([]);\n  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);';
content = content.replace('const [recipes, setRecipes] = useState<Recipe[]>([]);', stateHook);

const fetchConfigEffect = `
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d && d.readOnly) setIsReadOnly(true);
      })
      .catch(console.error);
  }, []);
`;
content = content.replace('useEffect(() => {\n    loadRecipes();', fetchConfigEffect + '\n  useEffect(() => {\n    loadRecipes();');

// 2. Hide Nový recept in sidebar (around line 3680)
content = content.replace(
  '<button\n                type="button"\n                onClick={navigateToAddRecipeModal}',
  '{!isReadOnly && (\n              <button\n                type="button"\n                onClick={navigateToAddRecipeModal}'
);
content = content.replace(
  '<span>Nový recept</span>\n              </button>',
  '<span>Nový recept</span>\n              </button>\n              )}'
);

// 3. Hide admin login (around header)
content = content.replace(
  '<button\n            onClick={() => setShowAdminSettingsModal(true)}',
  '{!isReadOnly && (\n          <button\n            onClick={() => setShowAdminSettingsModal(true)}'
);
// We need to be careful with closing braces for this button. Let's just use string replacement carefully.
