const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const badLayout = `                    {/* Synchronization Status & Button */}
                    <div className="bg-[#1B4332]/5 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          🐙 Odeslání dat na GitHub (Push)
                        </span>
                        <p className="text-xs text-slate-600">
                          Jednosměrně odešle (pushne) všechny lokální recepty na GitHub. Lokální data nebudou přepsána.
                        </p>
                      </div>

                    {/* Code Synchronization Status & Button */}
                    <div className="bg-[#1B4332]/5 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          💻 Odeslání CELÉHO KÓDU (vč. receptů) na GitHub
                        </span>
                        <p className="text-xs text-slate-600">
                          Tlačítko provede uložení všech souborů (včetně upravovaných zdrojových kódů).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCodeSync}
                        disabled={isCodeSyncing}
                        className="text-xs bg-slate-800 hover:bg-slate-900 disabled:bg-slate-800/30 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                      >
                        {isCodeSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Odesílám kód...</span>
                          </>
                        ) : (
                          <>
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>Odeslat celý kód</span>
                          </>
                        )}
                      </button>
                    </div>

                      <button
                        type="button"
                        onClick={handleManualGithubSync}
                        disabled={isManualSyncing}
                        className="text-xs bg-[#1B4332] hover:bg-[#153528] disabled:bg-[#1B4332]/30 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                      >
                        {isManualSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Synchronizuji...</span>
                          </>
                        ) : (
                          <>
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>Synchronizovat teď</span>
                          </>
                        )}
                      </button>
                    </div>`;

const goodLayout = `                    {/* Synchronization Status & Button */}
                    <div className="bg-[#1B4332]/5 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          🐙 Odeslání dat na GitHub (Push)
                        </span>
                        <p className="text-xs text-slate-600">
                          Jednosměrně odešle (pushne) všechny lokální recepty na GitHub. Lokální data nebudou přepsána.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleManualGithubSync}
                        disabled={isManualSyncing}
                        className="text-xs bg-[#1B4332] hover:bg-[#153528] disabled:bg-[#1B4332]/30 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                      >
                        {isManualSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Synchronizuji...</span>
                          </>
                        ) : (
                          <>
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>Synchronizovat teď</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Code Synchronization Status & Button */}
                    <div className="bg-[#1B4332]/5 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          💻 Odeslání CELÉHO KÓDU (vč. receptů) na GitHub
                        </span>
                        <p className="text-xs text-slate-600">
                          Tlačítko provede uložení všech souborů (včetně upravovaných zdrojových kódů).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCodeSync}
                        disabled={isCodeSyncing}
                        className="text-xs bg-slate-800 hover:bg-slate-900 disabled:bg-slate-800/30 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                      >
                        {isCodeSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Odesílám kód...</span>
                          </>
                        ) : (
                          <>
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>Odeslat celý kód</span>
                          </>
                        )}
                      </button>
                    </div>`;

if (content.includes('💻 Odeslání CELÉHO KÓDU (vč. receptů) na GitHub')) {
  content = content.replace(badLayout, goodLayout);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Patched layout");
} else {
  console.log("Not found");
}
