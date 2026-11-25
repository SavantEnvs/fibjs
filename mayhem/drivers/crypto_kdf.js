// Fuzz driver: KDF/cipher parameters from input (iterations, sizes incl. 0/negative, digest and
// cipher names, key/salt bytes): pbkdf2Sync, hkdfSync, scryptSync, createCipheriv/Decipheriv.
const fs = require('fs'), crypto = require('crypto');
const d = fs.readFile(process.argv[2]);
let p = 0;
const byte = () => p < d.length ? d[p++] : 0;
const i16 = () => ((byte() << 8) | byte()) - 256;
const digests = ['sha1', 'sha256', 'sha512', 'md5', 'sha3-256', 'sm3', 'blake2b512', 'ripemd160', 'nope'];
const ciphers = crypto.getCiphers ? crypto.getCiphers() : ['aes-128-cbc'];
const take = n => { const r = d.slice(p, p + n); p += n; return r; };
const sel = byte();
try {
    switch (sel % 6) {
        case 0: crypto.pbkdf2Sync(take(byte() % 32), take(byte() % 32), Math.min(i16(), 1000), i16(), digests[byte() % digests.length]); break;
        case 1: crypto.hkdfSync(digests[byte() % digests.length], take(byte() % 32), take(byte() % 32), take(byte() % 32), i16()); break;
        case 2: crypto.scryptSync(take(byte() % 32), take(byte() % 32), i16() % 256, { N: 1 << (byte() % 6), r: byte() % 4, p: byte() % 3 }); break;
        case 3: case 4: {
            const name = ciphers[((byte() << 8) | byte()) % ciphers.length];
            const key = take(byte() % 72), iv = take(byte() % 32);
            const c = sel % 6 === 3 ? crypto.createCipheriv(name, key, iv.length ? iv : null) : crypto.createDecipheriv(name, key, iv.length ? iv : null);
            c.update(d.slice(p)); c.final(); break;
        }
        case 5: {
            if (crypto.randomArt) crypto.randomArt(take(16), 'x', i16());
            if (crypto.pbkdf1) crypto.pbkdf1(take(8), take(8), Math.min(i16(), 1000), i16(), digests[byte() % digests.length]);
            crypto.createHash(digests[byte() % digests.length]).update(d.slice(p)).digest('hex');
            break;
        }
    }
} catch (e) { }
