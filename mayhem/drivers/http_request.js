// Fuzz driver: http.Request.readFrom over an in-memory buffered stream (request line, headers,
// chunked/length bodies, query, form, cookies).
const fs = require('fs'), io = require('io'), http = require('http');
const d = fs.readFile(process.argv[2]);
try {
    const ms = new io.MemoryStream(); ms.write(d); ms.rewind();
    const req = new http.Request();
    req.readFrom(new io.BufferedStream(ms));
    try { req.method; req.address; req.headers.all(); } catch (e) { }
    try { req.query.all(); } catch (e) { }
    try { req.cookies.all(); } catch (e) { }
    try { req.form.all(); } catch (e) { }
    try { req.json(); } catch (e) { }
    try { req.body.rewind(); req.body.readAll(); } catch (e) { }
} catch (e) { }
