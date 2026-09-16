const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Github tab from admin settings navigation
const githubTabBtn = `
                  <button
                    onClick={() => setActiveAdminTab("github")}
                    className={\`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all \${
                      activeAdminTab === "github"
                        ? "border-[#1B4332] text-[#1B4332] bg-[#1B4332]/5"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }\`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>GitHub Synchronizace</span>
                  </button>`;
content = content.replace(githubTabBtn, '');

// 2. Remove Github tab content
const startTab2 = '{/* TAB 2: GITHUB SYNC */}';
const endTab2 = '{/* TAB 3: DIAGNOSTICS */}';

const startIndex = content.indexOf(startTab2);
const endIndex = content.indexOf(endTab2);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// 3. Clean Diagnostics display to match new JSON
const oldDiag = `
                  <div className="border border-[#E8E8E1] rounded-2xl p-5 bg-[#FDFCF7]/40 space-y-4">
                    <div className="flex items-center gap-3 border-b border-[#E8E8E1] pb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-700" />
                      </div>
                      <h4 className="font-bold text-slate-800">Výsledek testu</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* FS Test */}
                      <div className="bg-white p-4 rounded-xl border border-[#E8E8E1] shadow-sm">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          FileSystem & Databáze
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Zápis a čtení souborů:</span>
                            <span className={\`font-bold \${diagnosticsResult.fsOk ? "text-emerald-600" : "text-red-600"}\`}>
                              {diagnosticsResult.fsOk ? "Funkční" : "Selhalo"}
                            </span>
                          </div>
                          {diagnosticsResult.fsMessage && (
                            <div className="text-xs text-slate-500 mt-1">{diagnosticsResult.fsMessage}</div>
                          )}
                          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-slate-100">
                            <span className="text-slate-600">Lokalizováno receptů:</span>
                            <span className="font-bold text-slate-800">{diagnosticsResult.recipesCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Gemini Test */}
                      <div className="bg-white p-4 rounded-xl border border-[#E8E8E1] shadow-sm">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Gemini AI Model
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Spojení s AI:</span>
                            <span className={\`font-bold \${diagnosticsResult.geminiOk ? "text-emerald-600" : "text-red-600"}\`}>
                              {diagnosticsResult.geminiOk ? "Funkční" : "Selhalo"}
                            </span>
                          </div>
                          {diagnosticsResult.geminiMessage && (
                            <div className="text-xs text-slate-500 mt-1">{diagnosticsResult.geminiMessage}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>`;

const newDiag = `
                  <div className="border border-[#E8E8E1] rounded-2xl p-5 bg-[#FDFCF7]/40 space-y-4">
                    <div className="flex items-center gap-3 border-b border-[#E8E8E1] pb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-700" />
                      </div>
                      <h4 className="font-bold text-slate-800">Výsledek testu</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Firestore Test */}
                      <div className="bg-white p-4 rounded-xl border border-[#E8E8E1] shadow-sm">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Firestore Databáze
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Zápis a čtení:</span>
                            <span className={\`font-bold \${diagnosticsResult.firestoreOk ? "text-emerald-600" : "text-red-600"}\`}>
                              {diagnosticsResult.firestoreOk ? "Funkční" : "Selhalo"}
                            </span>
                          </div>
                          {diagnosticsResult.firestoreMessage && (
                            <div className="text-xs text-slate-500 mt-1">{diagnosticsResult.firestoreMessage}</div>
                          )}
                          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-slate-100">
                            <span className="text-slate-600">Počet receptů (Firestore):</span>
                            <span className="font-bold text-slate-800">{diagnosticsResult.recipesCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Gemini Test */}
                      <div className="bg-white p-4 rounded-xl border border-[#E8E8E1] shadow-sm">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Gemini AI Model
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Spojení s AI:</span>
                            <span className={\`font-bold \${diagnosticsResult.geminiOk ? "text-emerald-600" : "text-red-600"}\`}>
                              {diagnosticsResult.geminiOk ? "Funkční" : "Selhalo"}
                            </span>
                          </div>
                          {diagnosticsResult.geminiMessage && (
                            <div className="text-xs text-slate-500 mt-1">{diagnosticsResult.geminiMessage}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>`;
content = content.replace(oldDiag, newDiag);


fs.writeFileSync(file, content);
