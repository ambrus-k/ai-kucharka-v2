const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject the function handleDownloadDiagnosticLog
const functionToInject = `
  const handleDownloadDiagnosticLog = () => {
    if (!diagnosticsResult) return;
    const logContent = \`DIAGNOSTICKÝ LOG - AI KUCHAŘKA
Čas: \${diagnosticsResult.timestamp || new Date().toISOString()}
=======================================
FIRESTORE DATABÁZE:
Stav: \${diagnosticsResult.firestoreOk ? "OK" : "CHYBA"}
Zpráva: \${diagnosticsResult.firestoreMessage || ""}
Počet receptů: \${diagnosticsResult.recipesCount || 0}

GEMINI AI API:
Stav: \${diagnosticsResult.geminiOk ? "OK" : "CHYBA"}
Zpráva: \${diagnosticsResult.geminiMessage || ""}
\`;
    const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`ai-kucharka-diagnostika-\${new Date().toISOString().replace(/:/g, '-')}.txt\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
`;

const anchor1 = 'setIsDiagnosing(false);\n    }\n  };';
content = content.replace(anchor1, anchor1 + '\n\n' + functionToInject);

// 2. Inject the button
const anchor2 = '{diagnosticsResult && (';
const buttonHtml = `
                    {diagnosticsResult && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-scale-up">
`;

// Note: the original block is:
/*
                    {diagnosticsResult && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-scale-up">
*/
const originalBlock = `{diagnosticsResult && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-scale-up">`;
                      
content = content.replace(originalBlock, buttonHtml);

// And close the div after the grid
const originalEnd = `                          </p>
                        </div>
                      </div>
                    )}`;
                    
const newEnd = `                          </p>
                        </div>
                      </div>
                      
                      {(!diagnosticsResult.firestoreOk || !diagnosticsResult.geminiOk) && (
                        <div className="flex justify-start animate-scale-up">
                          <button
                            type="button"
                            onClick={handleDownloadDiagnosticLog}
                            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 active:scale-95 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Stáhnout log chyb (.txt)
                          </button>
                        </div>
                      )}
                    </div>
                  )}`;

content = content.replace(originalEnd, newEnd);

fs.writeFileSync(file, content);
