const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add isReadOnly state
content = content.replace(
  'const [recipes, setRecipes] = useState<Recipe[]>([]);',
  'const [recipes, setRecipes] = useState<Recipe[]>([]);\n  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);'
);

// 2. Add fetch config effect
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
content = content.replace('const loadRecipes = async () => {', fetchConfigEffect + '\n    const loadRecipes = async () => {');

fs.writeFileSync('src/App.tsx', content);
