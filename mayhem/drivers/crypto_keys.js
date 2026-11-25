// Fuzz driver: key/certificate import (PEM string, DER buffer, JWK JSON) and re-export.
const fs = require('fs'), crypto = require('crypto');
const d = fs.readFile(process.argv[2]), s = d.toString();
function exp(k) {
    for (const o of [{ format: 'pem', type: 'spki' }, { format: 'der', type: 'spki' }, { format: 'jwk' }, { format: 'pem', type: 'pkcs8' }])
        try { k.export(o); } catch (e) { }
    try { k.asymmetricKeyType; k.asymmetricKeyDetails; } catch (e) { }
}
for (const inp of [s, d]) {
    try { exp(crypto.createPublicKey(inp)); } catch (e) { }
    try { exp(crypto.createPrivateKey(inp)); } catch (e) { }
    try { const c = new crypto.X509Certificate(inp); c.subject; c.issuer; c.toJSON && c.toJSON(); exp(c.publicKey); } catch (e) { }
}
for (const t of ['der']) try { exp(crypto.createPublicKey({ key: d, format: t, type: 'spki' })); } catch (e) { }
try { const j = JSON.parse(s); exp(crypto.createPublicKey({ key: j, format: 'jwk' })); exp(crypto.createPrivateKey({ key: j, format: 'jwk' })); } catch (e) { }
try { if (crypto.PKey) new crypto.PKey(s); } catch (e) { }
