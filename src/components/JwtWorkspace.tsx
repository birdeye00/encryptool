import React, { useState, useMemo } from 'react';
import { parseJwt } from '../utils/jwt';

export const JwtWorkspace: React.FC = () => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parseJwt(tokenInput);
  }, [tokenInput]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            JWT Header &amp; Payload Inspector
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTokenInput('')}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Token Input with color-coded display */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/40 transition-colors">
        <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-medium text-neutral-300">Encoded JWT Token</span>
          <span className="text-[11px] font-mono text-neutral-500">
            {tokenInput.trim() ? `${tokenInput.trim().split('.').length} segments` : '0 segments'}
          </span>
        </div>

        <textarea
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste JWT token here..."
          className="w-full p-4 bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed break-all"
          rows={3}
          spellCheck={false}
        />

        {parsed.rawHeader && !parsed.error && (
          <div className="px-4 py-2.5 border-t border-neutral-800/80 bg-neutral-950 text-xs font-mono break-all leading-relaxed">
            <span className="text-rose-400 font-semibold" title="Header">
              {parsed.rawHeader}
            </span>
            <span className="text-neutral-600 font-bold">.</span>
            <span className="text-indigo-400 font-semibold" title="Payload">
              {parsed.rawPayload}
            </span>
            {parsed.rawSignature && (
              <>
                <span className="text-neutral-600 font-bold">.</span>
                <span className="text-sky-400 font-semibold" title="Signature">
                  {parsed.rawSignature}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Empty State Prompt */}
      {!tokenInput.trim() && (
        <div className="flex flex-col items-center justify-center p-12 border border-neutral-800/80 rounded-xl bg-neutral-900/20 text-center">
          <p className="text-sm font-medium text-neutral-300">Enter or paste a JWT token to decode</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md">
            Inspect header algorithm, claims, expiration status, and payload details in real-time.
          </p>
        </div>
      )}

      {/* Parse Error */}
      {parsed.error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 font-mono">
          {parsed.error}
        </div>
      )}

      {/* Decoded Panels */}
      {parsed.header && parsed.payload && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Header Panel */}
          <div className="flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-400">Header</span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Algorithm: {parsed.algorithm || 'Unknown'}
                </span>
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(parsed.header, null, 2), 'header')}
                className="px-2.5 py-0.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
              >
                {copiedKey === 'header' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre className="p-4 bg-transparent text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed">
              {JSON.stringify(parsed.header, null, 2)}
            </pre>
          </div>

          {/* Payload Claims Panel */}
          <div className="flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-400">Payload Claims</span>
                {parsed.isExpired !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      parsed.isExpired
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                    }`}
                  >
                    {parsed.isExpired ? 'Token Expired' : 'Token Active'}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(parsed.payload, null, 2), 'payload')}
                className="px-2.5 py-0.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
              >
                {copiedKey === 'payload' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Timestamps */}
            {(parsed.expirationDate || parsed.issuedAtDate || parsed.notBeforeDate) && (
              <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs space-y-1.5 text-neutral-300">
                {parsed.expirationDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Expires (exp):</span>
                    <span className="font-mono text-indigo-200">{parsed.expirationDate}</span>
                  </div>
                )}
                {parsed.issuedAtDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Issued At (iat):</span>
                    <span className="font-mono text-neutral-200">{parsed.issuedAtDate}</span>
                  </div>
                )}
                {parsed.notBeforeDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Not Before (nbf):</span>
                    <span className="font-mono text-neutral-200">{parsed.notBeforeDate}</span>
                  </div>
                )}
              </div>
            )}

            <pre className="p-4 bg-transparent text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed flex-1">
              {JSON.stringify(parsed.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
