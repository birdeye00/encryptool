import { decodeBase64Url } from './encoders';
import { JwtDecoded } from '../types';

export function parseJwt(jwtToken: string): JwtDecoded {
  const clean = jwtToken.trim();
  if (!clean) {
    return {
      header: null,
      payload: null,
      signature: '',
      rawHeader: '',
      rawPayload: '',
      rawSignature: '',
    };
  }

  const parts = clean.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      rawHeader: parts[0] || '',
      rawPayload: parts[1] || '',
      rawSignature: parts[2] || '',
      error: `Invalid JWT format. A valid token consists of 2 or 3 dot-separated parts (Header.Payload[.Signature]). Found ${parts.length} parts.`,
    };
  }

  const [rawHeader, rawPayload, rawSignature = ''] = parts;
  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;

  try {
    const decodedHeaderStr = decodeBase64Url(rawHeader);
    header = JSON.parse(decodedHeaderStr);
  } catch (err) {
    return {
      header: null,
      payload: null,
      signature: rawSignature,
      rawHeader,
      rawPayload,
      rawSignature,
      error: `Failed to decode JWT Header: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    const decodedPayloadStr = decodeBase64Url(rawPayload);
    payload = JSON.parse(decodedPayloadStr);
  } catch (err) {
    return {
      header,
      payload: null,
      signature: rawSignature,
      rawHeader,
      rawPayload,
      rawSignature,
      error: `Failed to decode JWT Payload: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Parse claims if present
  let isExpired: boolean | undefined;
  let expirationDate: string | undefined;
  let issuedAtDate: string | undefined;
  let notBeforeDate: string | undefined;

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (payload && typeof payload.exp === 'number') {
    isExpired = payload.exp < nowSeconds;
    expirationDate = new Date(payload.exp * 1000).toLocaleString() + ` (${payload.exp < nowSeconds ? 'Expired' : 'Active'})`;
  }

  if (payload && typeof payload.iat === 'number') {
    issuedAtDate = new Date(payload.iat * 1000).toLocaleString();
  }

  if (payload && typeof payload.nbf === 'number') {
    notBeforeDate = new Date(payload.nbf * 1000).toLocaleString();
  }

  const algorithm = header && typeof header.alg === 'string' ? header.alg : undefined;

  return {
    header,
    payload,
    signature: rawSignature,
    rawHeader,
    rawPayload,
    rawSignature,
    isExpired,
    expirationDate,
    issuedAtDate,
    notBeforeDate,
    algorithm,
  };
}
