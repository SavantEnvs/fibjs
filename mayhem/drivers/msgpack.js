// Fuzz driver: msgpack.decode -> re-encode -> inspect.
const fs = require('fs'), msgpack = require('msgpack'), util = require('util');
const d = fs.readFile(process.argv[2]);
try { const v = msgpack.decode(d); msgpack.encode(v); util.inspect(v); } catch (e) { }
