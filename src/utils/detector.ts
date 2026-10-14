/**
 * Hash & Encoding Detection Engine
 * 
 * Inspects unidentified strings, hashes, tokens, and encodings using
 * regex patterns, entropy analysis, length calculations, and decoding heuristics.
 */

export type DetectionCategory = 'hash' | 'encoding' | 'token' | 'password-hash' | 'checksum';

export interface DetectionMatch {
  name: string;
  category: DetectionCategory;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  details?: string;
  hashcatMode?: string;
  johnTheRipperFormat?: string;
  bitLength?: number;
  securityRating?: 'secure' | 'deprecated' | 'insecure' | 'info';
  decodedPreview?: string;
  targetToolId?: 'base64' | 'base64url' | 'hex' | 'binary' | 'url-percent' | 'html-entities' | 'jwt-inspector' | 'json-escape' | 'hash-generator';
}

export interface StringAnalysis {
  length: number;
  byteLength: number;
  bitLength: number;
  entropy: number; // Shannon entropy in bits/char
  characterSet: string;
  isHex: boolean;
  isBase64: boolean;
  isBase64Url: boolean;
  isBinary: boolean;
  isAscii: boolean;
}

/**
 * Calculates Shannon entropy of a string (bits per character)
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const freqs: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freqs)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

/**
 * Computes character set metadata
 */
export function analyzeString(rawInput: string): StringAnalysis {
  const input = rawInput.trim();
  const len = input.length;
  const byteLength = new TextEncoder().encode(input).length;
  const entropy = calculateEntropy(input);

  const isHexOnly = len > 0 && /^[0-9a-fA-F]+$/.test(input);
  const isBinaryOnly = len > 0 && /^[01\s]+$/.test(input) && input.replace(/\s+/g, '').length % 8 === 0;
  const isBase64Pattern = len > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(input) && len % 4 === 0;
  const isBase64UrlPattern = len > 0 && /^[A-Za-z0-9_-]+$/.test(input);
  const isAsciiOnly = /^[\x00-\x7F]*$/.test(input);

  let charSet = 'Unicode / Multi-byte';
  if (isBinaryOnly) charSet = 'Binary (0, 1)';
  else if (isHexOnly) charSet = 'Hexadecimal (0-9, a-f)';
  else if (isBase64Pattern) charSet = 'Base64 (A-Z, a-z, 0-9, +, /, =)';
  else if (isBase64UrlPattern) charSet = 'Base64URL (A-Z, a-z, 0-9, -, _)';
  else if (isAsciiOnly) charSet = 'Printable ASCII (7-bit)';

  // Calculate bit length
  let bits = byteLength * 8;
  if (isHexOnly) bits = len * 4;
  else if (isBinaryOnly) bits = input.replace(/\s+/g, '').length;

  return {
    length: len,
    byteLength,
    bitLength: bits,
    entropy,
    characterSet: charSet,
    isHex: isHexOnly,
    isBase64: isBase64Pattern,
    isBase64Url: isBase64UrlPattern,
    isBinary: isBinaryOnly,
    isAscii: isAsciiOnly,
  };
}

/**
 * Safe base64 decoding check with preview
 */
function tryDecodeBase64(str: string): string | null {
  try {
    // Only test if matches base64 chars
    if (!/^[A-Za-z0-9+/=]+$/.test(str) || str.length < 4) return null;
    const binStr = atob(str);
    // Check if the decoded string looks like human-readable or structured data
    let printable = 0;
    for (let i = 0; i < binStr.length; i++) {
      const code = binStr.charCodeAt(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        printable++;
      }
    }
    // If over 70% printable, valid text preview
    if (printable / binStr.length > 0.7) {
      // Decode as utf-8
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safe Hex to UTF-8 text decoding check
 */
function tryDecodeHex(str: string): string | null {
  const clean = str.replace(/0x|\s|:/gi, '');
  if (clean.length < 2 || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) return null;
  try {
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    let printable = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        printable++;
      }
    }
    if (printable / text.length > 0.75) return text;
    return null;
  } catch {
    return null;
  }
}

/**
 * Safe Binary to ASCII decoding check
 */
function tryDecodeBinary(str: string): string | null {
  const clean = str.replace(/\s+/g, '');
  if (clean.length < 8 || clean.length % 8 !== 0 || !/^[01]+$/.test(clean)) return null;
  try {
    let result = '';
    for (let i = 0; i < clean.length; i += 8) {
      const byteVal = parseInt(clean.slice(i, i + 8), 2);
      result += String.fromCharCode(byteVal);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Detects schemes, hashes, and encodings
 */
export function detectString(rawInput: string): DetectionMatch[] {
  const input = rawInput.trim();
  if (!input) return [];

  const matches: DetectionMatch[] = [];
  const len = input.length;
  const isHex = /^[0-9a-fA-F]+$/.test(input);
  const cleanHex = input.replace(/0x|\s|:/gi, '');
  const isSeparatedHex = cleanHex.length > 0 && cleanHex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleanHex);

  // 1. Password Hashes (Highly specific signatures)
  if (input.startsWith('$2a$') || input.startsWith('$2b$') || input.startsWith('$2y$')) {
    if (len === 60) {
      matches.push({
        name: 'bcrypt',
        category: 'password-hash',
        confidence: 'high',
        summary: 'Adaptive password hashing function based on the Blowfish cipher.',
        details: 'Standard modular crypt format ($2a$, $2b$, or $2y$), 60 characters with embedded cost and salt.',
        hashcatMode: '3200',
        johnTheRipperFormat: 'bcrypt',
        bitLength: 192,
        securityRating: 'secure',
      });
    }
  }

  if (input.startsWith('$argon2i$') || input.startsWith('$argon2d$') || input.startsWith('$argon2id$')) {
    matches.push({
      name: 'Argon2 (Password Hashing Competition Winner)',
      category: 'password-hash',
      confidence: 'high',
      summary: 'State-of-the-art memory-hard key derivation and password hashing algorithm.',
      details: 'Contains algorithm identifier, version, memory cost (m), time cost (t), parallelism (p), salt and tag.',
      hashcatMode: '13000',
      johnTheRipperFormat: 'argon2',
      securityRating: 'secure',
    });
  }

  if (input.startsWith('$6$')) {
    matches.push({
      name: 'SHA-512 Crypt (Unix)',
      category: 'password-hash',
      confidence: 'high',
      summary: 'Unix shadow password hash using iterated SHA-512 with salt.',
      hashcatMode: '1800',
      johnTheRipperFormat: 'sha512crypt',
      securityRating: 'secure',
    });
  } else if (input.startsWith('$5$')) {
    matches.push({
      name: 'SHA-256 Crypt (Unix)',
      category: 'password-hash',
      confidence: 'high',
      summary: 'Unix shadow password hash using iterated SHA-256 with salt.',
      hashcatMode: '7400',
      johnTheRipperFormat: 'sha256crypt',
      securityRating: 'secure',
    });
  } else if (input.startsWith('$1$')) {
    matches.push({
      name: 'MD5 Crypt (Unix)',
      category: 'password-hash',
      confidence: 'high',
      summary: 'Legacy Unix password hash using 1,000 iterations of MD5.',
      hashcatMode: '500',
      johnTheRipperFormat: 'md5crypt',
      securityRating: 'insecure',
    });
  }

  // 2. Structured Tokens (JWT)
  const jwtParts = input.split('.');
  if (jwtParts.length === 3 && jwtParts[0].startsWith('eyJ') && /^[A-Za-z0-9_-]+$/.test(jwtParts[0]) && /^[A-Za-z0-9_-]+$/.test(jwtParts[1])) {
    try {
      const headerStr = atob(jwtParts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const parsedHeader = JSON.parse(headerStr);
      matches.push({
        name: 'JSON Web Token (JWT)',
        category: 'token',
        confidence: 'high',
        summary: `Compact, URL-safe security token with header alg: "${parsedHeader.alg || 'unknown'}".`,
        details: 'Consists of three Base64URL-encoded segments separated by periods: Header, Payload Claims, and Signature.',
        decodedPreview: `Header: ${headerStr}`,
        targetToolId: 'jwt-inspector',
      });
    } catch {
      // invalid json header, skip
    }
  }

  // 3. URL Percent Encoding
  if (/%[0-9a-fA-F]{2}/.test(input)) {
    try {
      const decoded = decodeURIComponent(input);
      if (decoded !== input) {
        matches.push({
          name: 'URL Percent-Encoding',
          category: 'encoding',
          confidence: 'high',
          summary: 'URI percent-encoded octets conforming to RFC 3986.',
          decodedPreview: decoded,
          targetToolId: 'url-percent',
        });
      }
    } catch {
      // not valid utf8 uri
    }
  }

  // 4. HTML Entities
  if (/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/.test(input)) {
    try {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      const decoded = txt.value;
      if (decoded !== input) {
        matches.push({
          name: 'HTML Entities',
          category: 'encoding',
          confidence: 'high',
          summary: 'HTML character entity references (named, decimal, or hexadecimal).',
          decodedPreview: decoded,
          targetToolId: 'html-entities',
        });
      }
    } catch {
      // ignore
    }
  }

  // 5. Binary (8-bit bytes)
  const binaryPreview = tryDecodeBinary(input);
  if (binaryPreview) {
    matches.push({
      name: 'Binary (8-bit ASCII)',
      category: 'encoding',
      confidence: 'high',
      summary: 'Binary-encoded text where each 8-bit byte represents an ASCII character.',
      decodedPreview: binaryPreview,
      targetToolId: 'binary',
    });
  }

  // 6. Base64 & Base64URL
  const base64Preview = tryDecodeBase64(input);
  if (base64Preview && !matches.some(m => m.name === 'JSON Web Token (JWT)')) {
    matches.push({
      name: 'Base64 (RFC 4648)',
      category: 'encoding',
      confidence: input.endsWith('=') ? 'high' : 'medium',
      summary: 'Binary-to-text encoding using the standard Base64 index table.',
      details: 'Decodes into valid readable text.',
      decodedPreview: base64Preview,
      targetToolId: 'base64',
    });
  }

  // 7. Hex Decodable Text
  const hexTextPreview = tryDecodeHex(input);
  if (hexTextPreview && isSeparatedHex) {
    matches.push({
      name: 'Hexadecimal (ASCII / UTF-8 Text)',
      category: 'encoding',
      confidence: 'high',
      summary: 'Hex-encoded character bytes representing human-readable text.',
      decodedPreview: hexTextPreview,
      targetToolId: 'hex',
    });
  }

  // 8. Cryptographic Hex Hashes (By exact length & character constraints)
  if (isHex) {
    if (len === 32) {
      // 128-bit
      matches.push({
        name: 'MD5',
        category: 'hash',
        confidence: 'high',
        summary: '128-bit message digest commonly used in checksums and legacy systems.',
        details: 'Cryptographically broken due to practical collision attacks. Avoid for digital signatures or security certificates.',
        hashcatMode: '0',
        johnTheRipperFormat: 'raw-md5',
        bitLength: 128,
        securityRating: 'deprecated',
        targetToolId: 'hash-generator',
      });
      matches.push({
        name: 'NTLM',
        category: 'hash',
        confidence: 'medium',
        summary: 'Windows NT LAN Manager password hash (MD4 of UTF-16LE password).',
        hashcatMode: '1000',
        johnTheRipperFormat: 'nt',
        bitLength: 128,
        securityRating: 'insecure',
      });
      matches.push({
        name: 'MD4',
        category: 'hash',
        confidence: 'low',
        summary: '128-bit legacy precursor to MD5. Cryptographically broken.',
        hashcatMode: '900',
        bitLength: 128,
        securityRating: 'insecure',
      });
    } else if (len === 40) {
      // 160-bit
      matches.push({
        name: 'SHA-1',
        category: 'hash',
        confidence: 'high',
        summary: '160-bit hash function widely used in Git commits and legacy TLS certificates.',
        details: 'Deprecated for cryptographic security due to demonstrated collision attacks (SHAttered).',
        hashcatMode: '100',
        johnTheRipperFormat: 'raw-sha1',
        bitLength: 160,
        securityRating: 'deprecated',
        targetToolId: 'hash-generator',
      });
      matches.push({
        name: 'RIPEMD-160',
        category: 'hash',
        confidence: 'medium',
        summary: '160-bit cryptographic hash function used in Bitcoin address generation.',
        hashcatMode: '6000',
        johnTheRipperFormat: 'ripemd-160',
        bitLength: 160,
        securityRating: 'deprecated',
      });
    } else if (len === 56) {
      // 224-bit
      matches.push({
        name: 'SHA-224',
        category: 'hash',
        confidence: 'high',
        summary: 'Truncated variant of SHA-256 providing 112 bits of security strength.',
        hashcatMode: '1300',
        bitLength: 224,
        securityRating: 'secure',
      });
      matches.push({
        name: 'SHA3-224',
        category: 'hash',
        confidence: 'medium',
        summary: 'NIST Keccak sponge-based 224-bit hash.',
        bitLength: 224,
        securityRating: 'secure',
      });
    } else if (len === 64) {
      // 256-bit
      matches.push({
        name: 'SHA-256',
        category: 'hash',
        confidence: 'high',
        summary: 'Standard 256-bit member of the SHA-2 family. Recommended for certificates, TLS, and blockchain.',
        details: 'Strong collision and preimage resistance. Industry-standard default hash algorithm.',
        hashcatMode: '1400',
        johnTheRipperFormat: 'raw-sha256',
        bitLength: 256,
        securityRating: 'secure',
        targetToolId: 'hash-generator',
      });
      matches.push({
        name: 'SHA3-256 (Keccak)',
        category: 'hash',
        confidence: 'medium',
        summary: 'NIST FIPS 202 Keccak-based 256-bit sponge hash used across Ethereum.',
        hashcatMode: '5000 / 17400',
        bitLength: 256,
        securityRating: 'secure',
      });
      matches.push({
        name: 'BLAKE2s-256',
        category: 'hash',
        confidence: 'medium',
        summary: 'High-performance cryptographic hash optimized for 8 to 32-bit platforms.',
        bitLength: 256,
        securityRating: 'secure',
      });
    } else if (len === 96) {
      // 384-bit
      matches.push({
        name: 'SHA-384',
        category: 'hash',
        confidence: 'high',
        summary: '384-bit truncated digest from the SHA-512 architecture. Highly secure.',
        hashcatMode: '10800',
        johnTheRipperFormat: 'raw-sha384',
        bitLength: 384,
        securityRating: 'secure',
        targetToolId: 'hash-generator',
      });
      matches.push({
        name: 'SHA3-384',
        category: 'hash',
        confidence: 'medium',
        summary: '384-bit Keccak sponge hash.',
        bitLength: 384,
        securityRating: 'secure',
      });
    } else if (len === 128) {
      // 512-bit
      matches.push({
        name: 'SHA-512',
        category: 'hash',
        confidence: 'high',
        summary: 'Full 512-bit member of SHA-2 family. Maximum cryptographic security.',
        details: 'Operates on 64-bit words, exceptionally fast on 64-bit microprocessors.',
        hashcatMode: '1700',
        johnTheRipperFormat: 'raw-sha512',
        bitLength: 512,
        securityRating: 'secure',
        targetToolId: 'hash-generator',
      });
      matches.push({
        name: 'SHA3-512 (Keccak-512)',
        category: 'hash',
        confidence: 'medium',
        summary: '512-bit NIST sponge hash.',
        bitLength: 512,
        securityRating: 'secure',
      });
      matches.push({
        name: 'BLAKE2b-512',
        category: 'hash',
        confidence: 'medium',
        summary: 'High-performance 512-bit hash faster than MD5 on 64-bit platforms.',
        hashcatMode: '600',
        bitLength: 512,
        securityRating: 'secure',
      });
    } else if (len === 8) {
      matches.push({
        name: 'CRC32',
        category: 'checksum',
        confidence: 'high',
        summary: '32-bit Cyclic Redundancy Check error-detecting code.',
        details: 'Used in Ethernet frames, ZIP archives, and PNG chunks. Non-cryptographic.',
        bitLength: 32,
        securityRating: 'info',
      });
      matches.push({
        name: 'Adler-32',
        category: 'checksum',
        confidence: 'medium',
        summary: '32-bit checksum algorithm used in zlib compression.',
        bitLength: 32,
        securityRating: 'info',
      });
    }
  }

  // 9. Base32 (RFC 4648)
  if (/^[A-Z2-7]+=*$/i.test(input) && input.length >= 8 && input.length % 8 === 0 && !isHex) {
    matches.push({
      name: 'Base32 (RFC 4648)',
      category: 'encoding',
      confidence: 'medium',
      summary: '32-character alphabet (A-Z, 2-7) frequently used in TOTP secret keys and human-entered codes.',
    });
  }

  // 10. JSON string escape sequences
  if (/(\\["\\/bfnrt]|\\u[0-9a-fA-F]{4})/.test(input)) {
    try {
      const parsed = JSON.parse(`"${input.replace(/"/g, '\\"')}"`);
      if (parsed !== input) {
        matches.push({
          name: 'JSON Escaped String',
          category: 'encoding',
          confidence: 'high',
          summary: 'Escaped string literal containing JSON control sequences or Unicode escape codes.',
          decodedPreview: parsed,
          targetToolId: 'json-escape',
        });
      }
    } catch {
      // ignore
    }
  }

  return matches;
}
