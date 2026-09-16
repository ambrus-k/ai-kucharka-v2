const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const applianceTipsOld = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider">Tipy pro moderní kuchyni</label>
                          <textarea 
                            rows={3}
                            value={editApplianceTips}
                            onChange={(e) => setEditApplianceTips(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                            required
                          />`;
const applianceTipsNew = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider flex justify-between"><span>Tipy pro moderní kuchyni</span> <span className="text-[10px] text-amber-800 font-medium lowercase">volitelné</span></label>
                          <textarea 
                            rows={3}
                            value={editApplianceTips}
                            onChange={(e) => setEditApplianceTips(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                          />`;

const expertOld = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider">Proč je to takto lepší? (Chemie jídla / Odůvodnění změn)</label>
                          <textarea 
                            rows={3}
                            value={editExpertJustification}
                            onChange={(e) => setEditExpertJustification(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                            required
                          />`;
const expertNew = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider flex justify-between"><span>Proč je to takto lepší? (Chemie jídla / Odůvodnění změn)</span> <span className="text-[10px] text-amber-800 font-medium lowercase">volitelné</span></label>
                          <textarea 
                            rows={3}
                            value={editExpertJustification}
                            onChange={(e) => setEditExpertJustification(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                          />`;

const applianceTypeOld = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider">Doporučený spotřebič</label>
                          <input 
                            type="text"
                            value={editApplianceType}
                            onChange={(e) => setEditApplianceType(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                            required
                          />`;
const applianceTypeNew = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider flex justify-between"><span>Doporučený spotřebič</span> <span className="text-[10px] text-amber-800 font-medium lowercase">volitelné</span></label>
                          <input 
                            type="text"
                            value={editApplianceType}
                            onChange={(e) => setEditApplianceType(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                          />`;

const summaryOld = `                          <textarea 
                            rows={2}
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            placeholder="Např. Šťavnaté maso odležené 2 hodiny v marinádě, pečené 45 min v horkovzdušné fritéze."
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                            required
                          />`;
const summaryNew = `                          <textarea 
                            rows={2}
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            placeholder="Např. Šťavnaté maso odležené 2 hodiny v marinádě, pečené 45 min v horkovzdušné fritéze."
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                          />`;

const cookTimeOld = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider">Celková doba</label>
                          <input 
                            type="text"
                            value={editCookingTime}
                            onChange={(e) => setEditCookingTime(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                            required
                          />`;
const cookTimeNew = `<label className="block text-xs font-bold text-[#1B4332] uppercase tracking-wider flex justify-between"><span>Celková doba</span> <span className="text-[10px] text-amber-800 font-medium lowercase">volitelné</span></label>
                          <input 
                            type="text"
                            value={editCookingTime}
                            onChange={(e) => setEditCookingTime(e.target.value)}
                            className="w-full text-sm p-3 border border-[#E8E8E1] rounded-lg bg-[#FDFCF7] text-[#2C2C2C] focus:outline-hidden focus:ring-1 focus:ring-[#1B4332]"
                          />`;

content = content.replace(applianceTipsOld, applianceTipsNew);
content = content.replace(expertOld, expertNew);
content = content.replace(applianceTypeOld, applianceTypeNew);
content = content.replace(summaryOld, summaryNew);
content = content.replace(cookTimeOld, cookTimeNew);

fs.writeFileSync('src/App.tsx', content);
