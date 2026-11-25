// Fuzz driver: http.Response.readFrom over an in-memory buffered stream (status line, headers,
// Set-Cookie, chunked bodies).
const fs = require('fs'), io = require('io'), http = require('http');
const d = fs.readFile(process.argv[2]);
try {
    const ms = new io.MemoryStream(); ms.write(d); ms.rewind();
    const rep = new http.Response();
    rep.readFrom(new io.BufferedStream(ms));
    try { rep.statusCode; rep.statusMessage; rep.headers.all(); } catch (e) { }
    try { const c = rep.cookies; for (let i = 0; i < c.length; i++) c[i].toString(); } catch (e) { }
    try { rep.json(); } catch (e) { }
    try { rep.body.rewind(); rep.body.readAll(); } catch (e) { }
} catch (e) { }
