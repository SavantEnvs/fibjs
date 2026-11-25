// Fuzz driver: encoding decoders; first byte selects base64/base32/base58/hex/multibase/charset
// decoding, TextDecoder or StringDecoder.
const fs = require('fs'), encoding = require('encoding');
const d = fs.readFile(process.argv[2]);
if (d.length > 0) {
    const data = d.slice(1), s = data.toString('latin1');
    const charsets = ['gbk', 'gb2312', 'big5', 'shift_jis', 'euc-jp', 'utf-16', 'utf-16be', 'utf-32', 'latin1', 'koi8-r', 'windows-1252', 'utf8'];
    const sel = d[0];
    try {
        switch (sel % 9) {
            case 0: encoding.base64.decode(s); break;
            case 1: encoding.base32.decode(s); break;
            case 2: encoding.base58.decode(s); break;
            case 3: encoding.hex.decode(s); break;
            case 4: encoding.multibase.decode(s); break;
            case 5: { const cs = charsets[(sel >> 4) % charsets.length]; const t = encoding.iconv ? encoding.iconv.decode(data, cs) : data.toString(); if (encoding.iconv) encoding.iconv.encode(t, cs); break; }
            case 6: new TextDecoder(charsets[(sel >> 4) % charsets.length]).decode(data); break;
            case 7: { const SD = require('string_decoder').StringDecoder; const sd = new SD(['utf8', 'utf16le', 'base64', 'hex', 'latin1'][(sel >> 4) % 5]); for (let i = 0; i < data.length; i += 3) sd.write(data.slice(i, i + 3)); sd.end(); break; }
            case 8: decodeURIComponent(s); break;
        }
    } catch (e) { }
}
