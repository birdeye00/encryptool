import { ToolId } from '../types';

export const TOOL_PRESETS: Record<ToolId, { encode: string; decode: string; description: string }> = {
  detector: {
    encode: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    decode: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    description: 'Automatic detection of cryptographic hash signatures and binary-to-text encodings.',
  },
  base64: {
    encode: 'Developer & Security Utility 2026 🚀 [UTF-8 Test: résumé, ñ, 漢字, €]',
    decode: 'RGV2ZWxvcGVyICYgU2VjdXJpdHkgVXRpbGl0eSAyMDI2IPCfmYAgW1VURi04IFRlc3Q6IHLDqXN1bcOpLCDDsSwg5ryi5a2XLCDigqzd',
    description: 'Universal Base64 encoder/decoder supporting multi-byte UTF-8 Unicode.',
  },
  base64url: {
    encode: '{"alg":"HS256","typ":"JWT","purpose":"auth_token_safe_chars"}',
    decode: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsInB1cnBvc2UiOiJhdXRoX3Rva2VuX3NhZmVfY2hhcnMifQ',
    description: 'URL and filename-safe variant without + / or trailing padding.',
  },
  'url-percent': {
    encode: 'https://api.example.com/search?q=developer tools & security=100%&tag=ciphers#hash',
    decode: 'https%3A%2F%2Fapi.example.com%2Fsearch%3Fq%3Ddeveloper%20tools%20%26%20security%3D100%25%26tag%3Dciphers%23hash',
    description: 'Percent-encode reserved URI characters according to RFC 3986.',
  },
  'html-entities': {
    encode: '<div class="alert" data-val="10 & 20">Warning: "Special" characters & \'symbols\'</div>',
    decode: '&lt;div class=&quot;alert&quot; data-val=&quot;10 &amp; 20&quot;&gt;Warning: &quot;Special&quot; characters &amp; &#39;symbols&#39;&lt;/div&gt;',
    description: 'Escape/unescape HTML characters to prevent XSS or display raw source.',
  },
  hex: {
    encode: 'Hello, Cryptography & Encodings!',
    decode: '48656c6c6f2c2043727970746f677261706879202620456e636f64696e677321',
    description: 'Raw byte hexadecimal representation with customizable delimiters.',
  },
  binary: {
    encode: 'Web 3.0',
    decode: '01010111 01100101 01100010 00100000 00110011 00101110 00110000',
    description: '8-bit binary representation of character byte values.',
  },
  ascii: {
    encode: 'Security 101: Encoding != Encryption',
    decode: '',
    description: 'Comprehensive character-by-character ASCII table with Decimal, Hex, Octal, Binary.',
  },
  unicode: {
    encode: 'Unicode & Emojis: 🔑 🛡️ € 𝒳 λ \u0041',
    decode: '\\u{1F511} \\u{1F6E1} \\u{20AC} \\u{1D4B3} \\u{3BB}',
    description: 'UTF-8 code point, byte sequences, surrogate pairs, and escape sequences.',
  },
  'json-escape': {
    encode: 'Line 1\nLine 2 with "quotes", \ttabs, and \\backslashes\\',
    decode: 'Line 1\\nLine 2 with \\"quotes\\", \\ttabs, and \\\\backslashes\\\\',
    description: 'Escape characters for valid JSON string literals and unescape JSON.',
  },
  'jwt-inspector': {
    encode: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggVmFuY2UiLCJyb2xlIjoiU2VjdXJpdHkgRW5naW5lZXIiLCJpYXQiOjE3MTAwMDAwMDAsImV4cCI6MTgwNDU2NzgwMCwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIn0.4a6c6c6f5f5369676e61747572655f46616b655f48617368',
    decode: '',
    description: 'Decode and inspect JWT header, payload claims, timestamps, and signature.',
  },
  'query-string': {
    encode: 'user_id=usr_9981&role=security_auditor&scopes=read%3Alogs+write%3Aaudit&active=true&timestamp=1710000000',
    decode: '',
    description: 'Parse query parameters into key-value pairs and reconstruct clean query strings.',
  },
  caesar: {
    encode: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
    decode: 'WKH TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ',
    description: 'Educational substitution cipher with adjustable shift (1-25).',
  },
  rot13: {
    encode: 'Why did the developer cross the road? To debug the other side!',
    decode: 'Jul qvq gur qrirybcre pebff gur ebnq? Gb qrjp gur bgure fvqr!',
    description: 'Special case of Caesar cipher with shift of 13. Self-reciprocal.',
  },
  'text-transform': {
    encode: 'encoding decoding and hashing lab for developers',
    decode: '',
    description: 'Case transformations (camelCase, snake_case, CONSTANT_CASE) and text manipulation.',
  },
  morse: {
    encode: 'SOS SEND BACKUP',
    decode: '... --- ... / ... . -. -.. / -... .- -.-. -.- ..- .--',
    description: 'Translate text to and from International Morse code dots and dashes.',
  },
  'hash-generator': {
    encode: 'The quick brown fox jumps over the lazy dog',
    decode: '',
    description: 'Compute SHA-256, SHA-512, SHA-384, SHA-1, and MD5 cryptographic digests.',
  },
  'hmac-generator': {
    encode: 'Payload to authenticate with HMAC signature',
    decode: '',
    description: 'Keyed-hash message authentication code (HMAC) with Web Crypto.',
  },
  'file-hasher': {
    encode: '',
    decode: '',
    description: 'Drag & drop file hashing in browser memory with verification against expected checksums.',
  },
};
