// Fuzz driver: Buffer API as an op stream; input bytes choose encodings, offsets and lengths.
const fs = require('fs');
const d = fs.readFile(process.argv[2]);
const encs = ['hex', 'base64', 'base64url', 'ucs2', 'utf16le', 'latin1', 'binary', 'utf8', 'ascii'];
let p = 0;
const byte = () => p < d.length ? d[p++] : 0;
const int = () => ((byte() << 8) | byte()) - 16384;
const enc = () => encs[byte() % encs.length];
const s = d.toString('latin1');
let b = Buffer.alloc(0);
try { b = Buffer.from(s, enc()); } catch (e) { }
for (let n = 0; n < 64 && p < d.length; n++) {
    const op = byte() % 14;
    try {
        switch (op) {
            case 0: b.toString(enc(), int(), int()); break;
            case 1: b.write(s.slice(0, byte()), int(), int(), enc()); break;
            case 2: b.readUIntBE(int(), byte() % 8); break;
            case 3: b.readIntLE(int(), byte() % 8); break;
            case 4: b.indexOf(d.slice(p, p + byte() % 8), int(), enc()); break;
            case 5: b.fill(s.slice(0, byte() % 8), int(), int(), enc()); break;
            case 6: { const t = Buffer.alloc(byte()); b.copy(t, int(), int(), int()); break; }
            case 7: b.compare(d, int(), int(), int(), int()); break;
            case 8: b.swap16(); break;
            case 9: b = b.slice(int(), int()); break;
            case 10: b.lastIndexOf(s.slice(0, byte() % 8), int(), enc()); break;
            case 11: Buffer.byteLength(s, enc()); break;
            case 12: b.writeDoubleLE(int(), int()); break;
            case 13: b = Buffer.concat([b, Buffer.from(s.slice(0, byte()), enc())]); break;
        }
    } catch (e) { }
}
