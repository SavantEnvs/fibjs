// Fuzz driver: zip.open(Buffer) -> namelist/infolist/readAll.
const fs = require('fs'), zip = require('zip');
const d = fs.readFile(process.argv[2]);
try {
    const z = zip.open(d);
    try { z.namelist(); } catch (e) { }
    try { z.infolist(); } catch (e) { }
    try { const l = z.namelist(); for (let i = 0; i < l.length && i < 64; i++) try { z.read(l[i]); } catch (e) { } } catch (e) { }
    try { z.readAll(); } catch (e) { }
    try { z.close(); } catch (e) { }
} catch (e) { }
