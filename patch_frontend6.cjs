const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '{isAdmin && (\n            <button\n              type="button"\n              onClick={navigateToAdminSettingsModal}',
  '{!isReadOnly && isAdmin && (\n            <button\n              type="button"\n              onClick={navigateToAdminSettingsModal}'
);

fs.writeFileSync('src/App.tsx', content);
