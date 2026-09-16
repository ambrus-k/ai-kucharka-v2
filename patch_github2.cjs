const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const tabStartStr = '{/* TAB 2: GITHUB SYNC */}';
const tabEndStr = '{/* TAB 3: CATEGORIES */}';

const startIndex = content.indexOf(tabStartStr);
const endIndex = content.indexOf(tabEndStr);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  content = before + after;
  fs.writeFileSync('src/App.tsx', content);
  console.log("Removed Github tab content");
} else {
  console.log("Could not find tab strings");
}
