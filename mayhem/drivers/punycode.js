// Fuzz driver: punycode decode/encode/toASCII/toUnicode and url.domainToASCII/domainToUnicode.
const fs = require('fs'), punycode = require('punycode'), url = require('url');
const s = fs.readTextFile(process.argv[2]);
for (const f of [() => punycode.decode(s), () => punycode.encode(s), () => punycode.toASCII(s),
    () => punycode.toUnicode(s), () => url.domainToASCII(s), () => url.domainToUnicode(s)])
    try { f(); } catch (e) { }
