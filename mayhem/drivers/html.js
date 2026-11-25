// Fuzz driver: xml.parse(text/html) (gumbo) -> DOM, selectors, style/classList, innerHTML.
const fs = require('fs'), xml = require('xml');
const s = fs.readTextFile(process.argv[2]);
try {
    const doc = xml.parse(s, 'text/html');
    doc.toString();
    const all = doc.querySelectorAll('*');
    for (let i = 0; i < all.length && i < 2000; i++) {
        const e = all[i];
        try { e.outerHTML; e.innerHTML; e.className; e.classList && e.classList.length; e.style && e.style.cssText; e.dataset && Object.keys(e.dataset); } catch (x) { }
    }
    if (doc.body) { try { doc.body.innerHTML = s; doc.body.toString(); } catch (x) { } }
} catch (e) { }
