import { md5, md5FromBytes } from './md5';
import { HashAlgorithmInfo, HashResult } from '../types';

export const HASH_ALGORITHMS: HashAlgorithmInfo[] = [
  {
    id: 'SHA-256',
    name: 'SHA-256',
    bitLength: 256,
    securityRating: 'secure',
    description: 'NIST standard (FIPS 180-4). Standard for TLS, code signing, Bitcoin, and general cryptographic integrity.',
  },
  {
    id: 'SHA-512',
    name: 'SHA-512',
    bitLength: 512,
    securityRating: 'secure',
    description: 'NIST standard with 512-bit output. Higher collision resistance, optimized for 64-bit architectures.',
  },
  {
    id: 'SHA-384',
    name: 'SHA-384',
    bitLength: 384,
    securityRating: 'secure',
    description: 'Truncated SHA-512 variant providing 384 bits. Immune to length-extension attacks against SHA-512.',
  },
  {
    id: 'SHA-1',
    name: 'SHA-1',
    bitLength: 160,
    securityRating: 'deprecated',
    warningMessage: 'SHA-1 is cryptographically broken by practical collision attacks (SHAttered, 2017). Do not use for security, TLS, or digital signatures. Safe only for legacy HMAC or git commit IDs.',
    description: '160-bit legacy digest. Deprecated by NIST, browsers, and standards bodies.',
  },
  {
    id: 'MD5',
    name: 'MD5',
    bitLength: 128,
    securityRating: 'insecure',
    warningMessage: 'MD5 is severely vulnerable to collision attacks (generating two distinct files with identical MD5 takes seconds). NEVER use for passwords, integrity verification against adversaries, or certificates.',
    description: '128-bit checksum. Use ONLY for legacy system compatibility, non-security deduplication, or simple file corruption checks.',
  },
];

/**
 * Convert an ArrayBuffer or Uint8Array to a hex string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert string or Uint8Array to ArrayBuffer
 */
export function toUint8Array(input: string | Uint8Array | ArrayBuffer, encoding: 'utf-8' | 'ascii' = 'utf-8'): Uint8Array {
  if (typeof input === 'string') {
    if (encoding === 'ascii') {
      const arr = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        arr[i] = input.charCodeAt(i) & 0x7f;
      }
      return arr;
    }
    return new TextEncoder().encode(input);
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  return new Uint8Array(input);
}

/**
 * Compute cryptographic digest for a string or Uint8Array
 */
export async function computeHash(
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1' | 'MD5',
  data: string | Uint8Array | ArrayBuffer,
  encoding: 'utf-8' | 'ascii' = 'utf-8'
): Promise<string> {
  const bytes = toUint8Array(data, encoding);

  if (algorithm === 'MD5') {
    return md5FromBytes(bytes);
  }

  // Web Crypto API
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes as unknown as BufferSource);
  return bufferToHex(hashBuffer);
}

/**
 * Compute all standard hashes for input simultaneously
 */
export async function computeAllHashes(
  data: string | Uint8Array | ArrayBuffer,
  encoding: 'utf-8' | 'ascii' = 'utf-8'
): Promise<HashResult[]> {
  const bytes = toUint8Array(data, encoding);
  const results: HashResult[] = [];

  for (const algo of HASH_ALGORITHMS) {
    const t0 = performance.now();
    try {
      let hex = '';
      if (algo.id === 'MD5') {
        hex = md5FromBytes(bytes);
      } else {
        const hashBuf = await crypto.subtle.digest(algo.id, bytes as unknown as BufferSource);
        hex = bufferToHex(hashBuf);
      }
      const timingMs = performance.now() - t0;
      results.push({
        algorithm: algo.name,
        hex,
        timingMs,
        securityRating: algo.securityRating,
        warning: algo.warningMessage,
      });
    } catch (err) {
      results.push({
        algorithm: algo.name,
        hex: `Error: ${err instanceof Error ? err.message : String(err)}`,
        securityRating: algo.securityRating,
        warning: algo.warningMessage,
      });
    }
  }

  return results;
}

/**
 * Generate HMAC using Web Crypto
 */
export async function computeHmac(
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1',
  keyText: string,
  messageText: string,
  outputFormat: 'hex' | 'base64' = 'hex'
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyText);
  const messageData = encoder.encode(messageText);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  if (outputFormat === 'base64') {
    const bytes = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  return bufferToHex(signature);
}

/**
 * Constant-time case-insensitive hash comparison with trimmed whitespace
 */
export function compareHashes(hashA: string, hashB: string): {
  isMatch: boolean;
  normalizedA: string;
  normalizedB: string;
  charDifferenceCount: number;
} {
  const cleanA = hashA.trim().toLowerCase().replace(/[\s:-]/g, '');
  const cleanB = hashB.trim().toLowerCase().replace(/[\s:-]/g, '');

  if (!cleanA || !cleanB) {
    return {
      isMatch: false,
      normalizedA: cleanA,
      normalizedB: cleanB,
      charDifferenceCount: Math.max(cleanA.length, cleanB.length),
    };
  }

  const isLengthEqual = cleanA.length === cleanB.length;
  let diff = 0;
  const maxLen = Math.max(cleanA.length, cleanB.length);

  for (let i = 0; i < maxLen; i++) {
    const charA = cleanA.charCodeAt(i) || 0;
    const charB = cleanB.charCodeAt(i) || 0;
    if (charA !== charB) {
      diff++;
    }
  }

  return {
    isMatch: isLengthEqual && diff === 0,
    normalizedA: cleanA,
    normalizedB: cleanB,
    charDifferenceCount: diff,
  };
}
