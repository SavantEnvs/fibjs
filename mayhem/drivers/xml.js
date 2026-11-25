// Fuzz driver: xml.parse(text/xml) -> DOM walk -> serialize. Input file = argv[2].
const fs = require('fs'), xml = require('xml');
const d = fs.readFile(process.argv[2]);
function walk(n, depth) {
    if (!n || depth > 64) return;
    try { n.nodeName; n.nodeValue; n.textContent; } catch (e) { }
    const c = n.childNodes;
    if (c) for (let i = 0; i < c.length; i++) walk(c[i], depth + 1);
}
try {
    const doc = xml.parse(d);
    doc.toString();
    walk(doc, 0);
    if (doc.documentElement) {
        doc.documentElement.getElementsByTagName('*');
        doc.documentElement.cloneNode(true).toString();
        doc.normalize();
    }
} catch (e) { }
