const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `<button
                type="button"
                onClick={navigateToAddRecipeModal}
                className="bg-[#D97706] hover:bg-[#C26405] active:scale-95 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                title="Vytvořit zcela nový recept"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Nový recept</span>
              </button>`;
              
const replacement = `{!isReadOnly && (
              <button
                type="button"
                onClick={navigateToAddRecipeModal}
                className="bg-[#D97706] hover:bg-[#C26405] active:scale-95 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                title="Vytvořit zcela nový recept"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Nový recept</span>
              </button>
              )}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
