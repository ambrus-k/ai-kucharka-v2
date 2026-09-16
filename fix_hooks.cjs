const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const injected = `
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d && d.readOnly) setIsReadOnly(true);
      })
      .catch(console.error);
  }, []);
`;

const replaceWith = `
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d && d.readOnly) setIsReadOnly(true);
      })
      .catch(console.error);
`;

content = content.replace(injected, replaceWith);
fs.writeFileSync('src/App.tsx', content);
