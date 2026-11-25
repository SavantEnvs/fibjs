// Fuzz driver: zlib decompressors; first byte selects the codec, rest is the compressed stream.
const fs = require('fs'), zlib = require('zlib');
const d = fs.readFile(process.argv[2]);
if (d.length > 0) {
    const data = d.slice(1), max = 1024 * 1024;
    const fns = ['inflate', 'gunzip', 'inflateRaw', 'unzip', 'brotliDecompress', 'zstdDecompress', 'gunzipSync', 'inflateSync'];
    const fn = fns[d[0] % fns.length];
    try {
        if (typeof zlib[fn] === 'function') zlib[fn](data, max);
    } catch (e) { }
}
