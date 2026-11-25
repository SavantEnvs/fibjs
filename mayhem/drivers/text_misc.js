// Fuzz driver: text parsers; first byte selects util.parseEnv, json decode/encode, path.matchesGlob
// (input split at newline into path/pattern) or util.format.
const fs = require('fs'), util = require('util'), path = require('path');
const d = fs.readFile(process.argv[2]);
if (d.length > 0) {
    const s = d.slice(1).toString();
    try {
        switch (d[0] % 4) {
            case 0: util.parseEnv(s); break;
            case 1: { const json = require('encoding').json; json.encode(json.decode(s)); break; }
            case 2: { const i = s.indexOf('\n'); path.matchesGlob(i < 0 ? s : s.slice(0, i), i < 0 ? '*' : s.slice(i + 1)); break; }
            case 3: util.format(s, 1, 'x', { a: [1] }, 2.5, null); break;
        }
    } catch (e) { }
}
