/**
 * Pure functions for text encodings, decodings, and transforms.
 * Designed to be browser-safe, memory-efficient, and handle UTF-8 edge cases properly.
 */

// ----------------------------------------------------
// Base64 & Base64URL (Unicode Safe)
// ----------------------------------------------------

export function encodeBase64(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  const clean = input.trim().replace(/\s+/g, '');
  if (!clean) return '';
  
  // Validate Base64 chars
  if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
    throw new Error('Invalid Base64 characters detected. Input must contain only A-Z, a-z, 0-9, +, /, and = padding.');
  }

  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.name === 'TypeError')) {
      throw new Error('Malformed UTF-8 sequence in decoded Base64 payload.');
    }
    throw new Error('Failed to decode Base64: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export function encodeBase64Url(input: string, keepPadding = false): string {
  const standard = encodeBase64(input);
  let urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_');
  if (!keepPadding) {
    urlSafe = urlSafe.replace(/=+$/, '');
  }
  return urlSafe;
}

export function decodeBase64Url(input: string): string {
  let base64 = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to multiple of 4
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return decodeBase64(base64);
}

// ----------------------------------------------------
// URL Percent-Encoding (RFC 3986 compliant)
// ----------------------------------------------------

export function encodeUrl(input: string, options: { mode: 'component' | 'fullUrl'; rfc3986?: boolean }): string {
  let result = options.mode === 'component' ? encodeURIComponent(input) : encodeURI(input);
  if (options.rfc3986) {
    // RFC 3986 encodes !, ', (, ), * which standard encodeURIComponent preserves
    result = result.replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }
  return result;
}

export function decodeUrl(input: string, mode: 'component' | 'fullUrl'): string {
  try {
    return mode === 'component' ? decodeURIComponent(input) : decodeURI(input);
  } catch (e) {
    throw new Error('Invalid URL encoding sequence: URI malformed at ' + (e instanceof Error ? e.message : 'percent sign'));
  }
}

// ----------------------------------------------------
// HTML Entities
// ----------------------------------------------------

const NAMED_HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function encodeHtmlEntities(
  input: string,
  format: 'named' | 'decimal' | 'hex' = 'named',
  allChars = false
): string {
  if (allChars) {
    let out = '';
    for (const char of input) {
      const code = char.codePointAt(0);
      if (!code) continue;
      if (format === 'hex') {
        out += `&#x${code.toString(16).toUpperCase()};`;
      } else {
        out += `&#${code};`;
      }
    }
    return out;
  }

  if (format === 'decimal') {
    return input.replace(/[&<>"'/`=]/g, (c) => `&#${c.charCodeAt(0)};`);
  }
  if (format === 'hex') {
    return input.replace(/[&<>"'/`=]/g, (c) => `&#x${c.charCodeAt(0).toString(16).toUpperCase()};`);
  }
  return input.replace(/[&<>"']/g, (c) => NAMED_HTML_ENTITIES[c] || c);
}

export function decodeHtmlEntities(input: string): string {
  // Safe browser decoding using DOMParser
  const doc = new DOMParser().parseFromString(input, 'text/html');
  return doc.documentElement.textContent || '';
}

// ----------------------------------------------------
// Hex Encoding / Decoding
// ----------------------------------------------------

export function encodeHex(
  input: string,
  delimiter: 'none' | 'space' | 'colon' | '0x' = 'none',
  uppercase = false
): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const hexArray: string[] = [];

  for (let i = 0; i < bytes.length; i++) {
    let hex = bytes[i].toString(16).padStart(2, '0');
    if (uppercase) hex = hex.toUpperCase();
    if (delimiter === '0x') {
      hexArray.push('0x' + hex);
    } else {
      hexArray.push(hex);
    }
  }

  if (delimiter === 'space' || delimiter === '0x') {
    return hexArray.join(' ');
  }
  if (delimiter === 'colon') {
    return hexArray.join(':');
  }
  return hexArray.join('');
}

export function decodeHex(input: string): string {
  const clean = input.replace(/0x/gi, '').replace(/[\s:,\-_]/g, '');
  if (!clean) return '';

  if (clean.length % 2 !== 0) {
    throw new Error(`Hex string has an odd length (${clean.length} characters). Each byte requires 2 hexadecimal digits.`);
  }

  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error('Hex string contains non-hexadecimal characters. Only 0-9 and A-F are permitted.');
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch {
    // If not valid UTF-8, fall back to Latin-1
    let fallback = '';
    for (let i = 0; i < bytes.length; i++) {
      fallback += String.fromCharCode(bytes[i]);
    }
    return fallback;
  }
}

// ----------------------------------------------------
// Binary Text Conversion
// ----------------------------------------------------

export function encodeBinary(input: string, withSpaces = true): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const binaryArray: string[] = [];

  for (let i = 0; i < bytes.length; i++) {
    binaryArray.push(bytes[i].toString(2).padStart(8, '0'));
  }

  return binaryArray.join(withSpaces ? ' ' : '');
}

export function decodeBinary(input: string): string {
  const clean = input.replace(/\s+/g, '');
  if (!clean) return '';

  if (!/^[01]+$/.test(clean)) {
    throw new Error('Invalid binary text. Only 0 and 1 are allowed.');
  }

  if (clean.length % 8 !== 0) {
    throw new Error(`Binary bit count is not a multiple of 8 (found ${clean.length} bits, remainder ${clean.length % 8}).`);
  }

  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    bytes[i / 8] = parseInt(clean.substring(i, i + 8), 2);
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

// ----------------------------------------------------
// Unicode & UTF-8 Inspector / Conversion
// ----------------------------------------------------

export interface UnicodeCharDetail {
  character: string;
  codePoint: number;
  hexCodePoint: string;
  utf8Hex: string;
  utf8Binary: string;
  utf8Decimal: number[];
  utf16Hex: string;
  isPrintable: boolean;
  name?: string;
}

export function analyzeUnicode(input: string): UnicodeCharDetail[] {
  const details: UnicodeCharDetail[] = [];
  const encoder = new TextEncoder();

  for (const char of input) {
    const cp = char.codePointAt(0) ?? 0;
    const bytes = encoder.encode(char);
    const hexBytes: string[] = [];
    const binBytes: string[] = [];
    const decBytes: number[] = [];

    for (let i = 0; i < bytes.length; i++) {
      hexBytes.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
      binBytes.push(bytes[i].toString(2).padStart(8, '0'));
      decBytes.push(bytes[i]);
    }

    const utf16Hex = Array.from(char)
      .map((c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase())
      .join('');

    details.push({
      character: char === ' ' ? '␣' : char === '\n' ? '↵' : char === '\t' ? '⇥' : char,
      codePoint: cp,
      hexCodePoint: 'U+' + cp.toString(16).padStart(4, '0').toUpperCase(),
      utf8Hex: hexBytes.join(' '),
      utf8Binary: binBytes.join(' '),
      utf8Decimal: decBytes,
      utf16Hex,
      isPrintable: cp >= 32 && cp !== 127,
    });
  }

  return details;
}

export function encodeUnicodeEscapes(input: string, style: 'u16' | 'u32_braces' = 'u16'): string {
  let result = '';
  for (const char of input) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp > 127) {
      if (style === 'u32_braces') {
        result += `\\u{${cp.toString(16).toUpperCase()}}`;
      } else {
        // UTF-16 surrogates if > 0xFFFF
        if (cp > 0xffff) {
          const lead = Math.floor((cp - 0x10000) / 0x400) + 0xd800;
          const trail = ((cp - 0x10000) % 0x400) + 0xdc00;
          result += `\\u${lead.toString(16).padStart(4, '0').toUpperCase()}\\u${trail.toString(16).padStart(4, '0').toUpperCase()}`;
        } else {
          result += `\\u${cp.toString(16).padStart(4, '0').toUpperCase()}`;
        }
      }
    } else {
      result += char;
    }
  }
  return result;
}

export function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, braces, four) => {
    const hex = braces || four;
    const code = parseInt(hex, 16);
    return String.fromCodePoint(code);
  });
}

// ----------------------------------------------------
// ASCII Conversion & Inspector
// ----------------------------------------------------

export interface AsciiInspectionRow {
  char: string;
  dec: number;
  hex: string;
  oct: string;
  bin: string;
  desc: string;
}

export function inspectAscii(input: string): AsciiInspectionRow[] {
  const rows: AsciiInspectionRow[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const char = input[i];
    let desc = 'Printable Character';

    if (code === 32) desc = 'Space';
    else if (code === 10) desc = 'Line Feed (\\n)';
    else if (code === 13) desc = 'Carriage Return (\\r)';
    else if (code === 9) desc = 'Horizontal Tab (\\t)';
    else if (code === 0) desc = 'Null Byte (NUL)';
    else if (code < 32) desc = `Control Character (ASCII ${code})`;
    else if (code === 127) desc = 'Delete (DEL)';
    else if (code > 127) desc = 'Extended ASCII / Non-ASCII UTF-8';

    rows.push({
      char: code === 32 ? '␣' : code === 10 ? '\\n' : code === 13 ? '\\r' : code === 9 ? '\\t' : char,
      dec: code,
      hex: '0x' + code.toString(16).padStart(2, '0').toUpperCase(),
      oct: code.toString(8).padStart(3, '0'),
      bin: code.toString(2).padStart(8, '0'),
      desc,
    });
  }
  return rows;
}

// ----------------------------------------------------
// JSON String Escape / Unescape & Formatting
// ----------------------------------------------------

export function escapeJsonString(input: string): string {
  return JSON.stringify(input).slice(1, -1);
}

export function unescapeJsonString(input: string): string {
  try {
    return JSON.parse(`"${input.replace(/"/g, '\\"')}"`);
  } catch {
    // Basic unescape fallback
    return input
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

export function formatJson(input: string, indent: 2 | 4 | 'tab' | 'minify' = 2): string {
  try {
    const parsed = JSON.parse(input);
    if (indent === 'minify') {
      return JSON.stringify(parsed);
    }
    const space = indent === 'tab' ? '\t' : indent;
    return JSON.stringify(parsed, null, space);
  } catch (e) {
    throw new Error('Invalid JSON: ' + (e instanceof Error ? e.message : String(e)));
  }
}

// ----------------------------------------------------
// Caesar Cipher & ROT13 (Educational Toy Ciphers)
// ----------------------------------------------------

export function caesarCipher(input: string, shift: number, decrypt = false): string {
  // Normalize shift to 0-25
  let normalizedShift = ((shift % 26) + 26) % 26;
  if (decrypt) {
    normalizedShift = (26 - normalizedShift) % 26;
  }

  let result = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);

    // Uppercase A-Z (65-90)
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
    }
    // Lowercase a-z (97-122)
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
    } else {
      result += input[i];
    }
  }
  return result;
}

export function rot13(input: string): string {
  return caesarCipher(input, 13);
}

// ----------------------------------------------------
// Custom Text Transforms
// ----------------------------------------------------

export type TextTransformMode =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'camelcase'
  | 'snakecase'
  | 'kebabcase'
  | 'pascalcase'
  | 'constantcase'
  | 'reverse-chars'
  | 'reverse-words'
  | 'reverse-lines'
  | 'trim-lines'
  | 'collapse-whitespace'
  | 'strip-empty-lines';

export function applyTextTransform(input: string, mode: TextTransformMode): string {
  switch (mode) {
    case 'uppercase':
      return input.toUpperCase();
    case 'lowercase':
      return input.toLowerCase();
    case 'titlecase':
      return input.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    case 'camelcase': {
      const words = input.trim().split(/[\s_\-]+/);
      return words
        .map((w, idx) => (idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()))
        .join('');
    }
    case 'pascalcase': {
      const words = input.trim().split(/[\s_\-]+/);
      return words.map((w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()).join('');
    }
    case 'snakecase':
      return input
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
    case 'kebabcase':
      return input
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    case 'constantcase':
      return input
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toUpperCase();
    case 'reverse-chars':
      return Array.from(input).reverse().join('');
    case 'reverse-words':
      return input
        .split('\n')
        .map((line) => line.split(/\s+/).reverse().join(' '))
        .join('\n');
    case 'reverse-lines':
      return input.split('\n').reverse().join('\n');
    case 'trim-lines':
      return input
        .split('\n')
        .map((l) => l.trim())
        .join('\n');
    case 'collapse-whitespace':
      return input.replace(/[^\S\r\n]+/g, ' ');
    case 'strip-empty-lines':
      return input
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .join('\n');
    default:
      return input;
  }
}

// ----------------------------------------------------
// Morse Code
// ----------------------------------------------------

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.', 0: '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/',
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {}
);

export function encodeMorse(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map((c) => MORSE_MAP[c] || c)
    .join(' ');
}

export function decodeMorse(input: string): string {
  const tokens = input.trim().split(/\s+/);
  return tokens.map((t) => REVERSE_MORSE_MAP[t] || (t === '/' ? ' ' : t)).join('');
}
