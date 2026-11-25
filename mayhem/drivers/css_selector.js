// Fuzz driver: CSS selector parser/matcher (querySelectorAll/querySelector/matches/closest) over a
// fixed HTML document; the input is the selector.
const fs = require('fs'), xml = require('xml');
const sel = fs.readTextFile(process.argv[2]);
const doc = xml.parse(`<html><head><title>t</title></head><body class="a b" id="root" data-x="1">
<div id="d1" class="c1 c2" lang="en-US"><p>one</p><p class="x">two<span title="s">3</span></p></div>
<ul><li>1</li><li class="odd">2</li><li>3</li><li lang="fr">4</li></ul><input type="text" checked disabled>
<a href="http://x/y" rel="nofollow">l</a><table><tr><td>c</td><th>h</th></tr></table><!-- c --></body></html>`, 'text/html');
for (const f of [() => doc.querySelectorAll(sel), () => doc.querySelector(sel), () => doc.body.matches(sel),
    () => doc.getElementById('d1').closest(sel), () => doc.body.querySelectorAll(sel)])
    try { f(); } catch (e) { }
