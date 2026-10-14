export type ToolCategory = 
  | 'all'
  | 'detection'
  | 'reversible'
  | 'tokens-data'
  | 'ciphers'
  | 'hashes'
  | 'file-checksum';

export type ToolId =
  | 'detector'
  | 'base64'
  | 'base64url'
  | 'url-percent'
  | 'html-entities'
  | 'hex'
  | 'binary'
  | 'ascii'
  | 'unicode'
  | 'json-escape'
  | 'jwt-inspector'
  | 'query-string'
  | 'caesar'
  | 'rot13'
  | 'text-transform'
  | 'morse'
  | 'hash-generator'
  | 'hmac-generator'
  | 'file-hasher';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  category: ToolCategory;
  description: string;
  isReversible: boolean;
  isCryptographic: boolean;
  securityNotice?: string;
  badge?: string;
}

export type OperationMode = 'encode' | 'decode';

export interface HashAlgorithmInfo {
  id: string;
  name: string;
  bitLength: number;
  securityRating: 'secure' | 'deprecated' | 'insecure';
  warningMessage?: string;
  description: string;
}

export interface HashResult {
  algorithm: string;
  hex: string;
  timingMs?: number;
  securityRating: 'secure' | 'deprecated' | 'insecure';
  warning?: string;
}

export interface JwtDecoded {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  rawHeader: string;
  rawPayload: string;
  rawSignature: string;
  isExpired?: boolean;
  expirationDate?: string;
  issuedAtDate?: string;
  notBeforeDate?: string;
  algorithm?: string;
  error?: string;
}

export interface QueryParamPair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
