const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const hookInsert = `  const auditAbortRef = useRef<AbortController | null>(null);
  const auditPanelRef = useRef<HTMLDivElement | null>(null);`;
content = content.replace('  const auditAbortRef = useRef<AbortController | null>(null);', hookInsert);

const auditActionInsert = `    setIsAuditing(true);
    setTimeout(() => {
      if (auditPanelRef.current) {
        auditPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);`;
content = content.replace('    setIsAuditing(true);', auditActionInsert);

const divInsert = `                    <motion.div
                      ref={auditPanelRef}
                      initial={{ opacity: 0, height: 0 }}`;
content = content.replace(`                    <motion.div\n                      initial={{ opacity: 0, height: 0 }}`, divInsert);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched scrolling");
