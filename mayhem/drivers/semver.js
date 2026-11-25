// Fuzz driver: semver version/range parser; input split at newline into (version, range).
const fs = require('fs'), semver = require('semver');
const s = fs.readTextFile(process.argv[2]);
const i = s.indexOf('\n'), v = i < 0 ? s : s.slice(0, i), r = i < 0 ? s : s.slice(i + 1);
for (const loose of [false, true])
    for (const f of [() => semver.valid(v, loose), () => semver.clean(v, loose), () => semver.coerce(v),
        () => semver.validRange(r, loose), () => semver.satisfies(v, r, loose), () => semver.intersects(r, v, loose),
        () => semver.minVersion(r, loose), () => semver.inc(v, 'prerelease', loose), () => semver.parse(v, loose)])
        try { f(); } catch (e) { }
