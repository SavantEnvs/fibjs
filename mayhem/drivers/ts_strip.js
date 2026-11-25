// Fuzz driver: util.stripTypeScript (ts_strip scanner/transformer, enum lowering).
const fs = require('fs'), util = require('util');
const s = fs.readTextFile(process.argv[2]);
try { util.stripTypeScript(s); } catch (e) { }
try { util.stripTypeScript(s, { mode: 'transform' }); } catch (e) { }
