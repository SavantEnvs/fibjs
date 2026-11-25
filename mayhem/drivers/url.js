// Fuzz driver: url.parse/resolve/format, WHATWG URL, URLSearchParams, querystring.parse.
// Input is split at the first newline into (base, relative).
const fs = require('fs'), url = require('url'), qs = require('querystring');
const s = fs.readTextFile(process.argv[2]);
const i = s.indexOf('\n'), a = i < 0 ? s : s.slice(0, i), b = i < 0 ? '' : s.slice(i + 1);
for (const f of [() => url.format(url.parse(a, true)), () => url.parse(b, true, true).href, () => url.resolve(a, b),
    () => new URL(b, a).href, () => new URL(a).toString(), () => new URLSearchParams(a).toString(),
    () => qs.stringify(qs.parse(a))])
    try { f(); } catch (e) { }
