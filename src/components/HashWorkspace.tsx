import React, { useState, useEffect } from 'react';
import { computeAllHashes, computeHmac, compareHashes } from '../utils/crypto';
import { HashResult } from '../types';

export const HashWorkspace: React.FC<{ initialMode?: 'digest' | 'hmac' }> = ({ initialMode = 'digest' }) => {
  const [tab, setTab] = useState<'digest' | 'hmac'>(initialMode);
  const [input, setInput] = useState<string>('');
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8');
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Verification / Comparison
  const [expectedHash, setExpectedHash] = useState<string>('');

  // HMAC Specific
  const [hmacSecret, setHmacSecret] = useState<string>('');
  const [hmacAlgo, setHmacAlgo] = useState<'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1'>('SHA-256');
  const [hmacFormat, setHmacFormat] = useState<'hex' | 'base64'>('hex');
  const [hmacResult, setHmacResult] = useState<string>('');
  const [hmacTiming, setHmacTiming] = useState<number>(0);

  // Compute standard hashes
  useEffect(() => {
    let isCancelled = false;
    if (!input) {
      setHashes([]);
      return;
    }

    setIsComputing(true);
    computeAllHashes(input, encoding).then((res) => {
      if (!isCancelled) {
        setHashes(res);
        setIsComputing(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [input, encoding]);

  // Compute HMAC
  useEffect(() => {
    if (tab !== 'hmac') return;
    if (!input || !hmacSecret) {
      setHmacResult('');
      return;
    }

    const t0 = performance.now();
    computeHmac(hmacAlgo, hmacSecret, input, hmacFormat).then((sig) => {
      setHmacResult(sig);
      setHmacTiming(performance.now() - t0);
    });
  }, [input, hmacSecret, hmacAlgo, hmacFormat, tab]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const matchResult = React.useMemo(() => {
    if (!expectedHash.trim() || hashes.length === 0) return null;
    for (const h of hashes) {
      const cmp = compareHashes(h.hex, expectedHash);
      if (cmp.isMatch) {
        return {
          matches: true,
          algorithm: h.algorithm,
        };
      }
    }
    if (tab === 'hmac' && hmacResult) {
      const cmp = compareHashes(hmacResult, expectedHash);
      if (cmp.isMatch) {
        return {
          matches: true,
          algorithm: `HMAC-${hmacAlgo}`,
        };
      }
    }
    return {
      matches: false,
      algorithm: null,
    };
  }, [expectedHash, hashes, tab, hmacResult, hmacAlgo]);

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            Cryptographic Hashes &amp; HMAC
          </h1>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setTab('digest')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tab === 'digest'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Standard Digests
          </button>
          <button
            onClick={() => setTab('hmac')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tab === 'hmac'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            HMAC Signer
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/40 transition-colors">
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs gap-2">
          <div className="flex items-center gap-3">
            <span className="text-neutral-300 font-medium">Input Payload</span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {input.length} chars · {new TextEncoder().encode(input).length} bytes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              Charset:
              <select
                value={encoding}
                onChange={(e) => setEncoding(e.target.value as 'utf-8' | 'ascii')}
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 focus:outline-hidden"
              >
                <option value="utf-8">UTF-8</option>
                <option value="ascii">ASCII</option>
              </select>
            </label>

            <button
              onClick={() => setInput('')}
              className="text-xs text-neutral-400 hover:text-neutral-200 px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
          className="w-full p-4 bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed"
          rows={3}
          spellCheck={false}
        />
      </div>

      {/* Verification / Checksum Comparison Input */}
      <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-200">
            Hash Verification / Checksum Comparison
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Case-insensitive · Trims whitespace &amp; colons
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            placeholder="Paste expected hash to verify..."
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
          />
          {expectedHash && (
            <button
              onClick={() => setExpectedHash('')}
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Comparison Result Banner */}
        {expectedHash.trim() && matchResult && (
          <div
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              matchResult.matches
                ? 'bg-emerald-950/50 border border-emerald-600 text-emerald-200'
                : 'bg-rose-950/50 border border-rose-600 text-rose-200'
            }`}
          >
            {matchResult.matches ? (
              <span>
                <strong>Match:</strong> Digest matches computed <span className="font-mono underline">{matchResult.algorithm}</span> hash.
              </span>
            ) : (
              <span>
                <strong>Mismatch:</strong> Input does not match any computed digest for this payload.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Standard Hashes */}
      {tab === 'digest' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Computed Cryptographic Digests</span>
            {isComputing && <span className="text-indigo-400 animate-pulse">Computing...</span>}
          </div>

          <div className="space-y-3">
            {hashes.map((h) => {
              const isMatch =
                expectedHash.trim() &&
                compareHashes(h.hex, expectedHash).isMatch;

              return (
                <div
                  key={h.algorithm}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isMatch
                      ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/40'
                      : h.securityRating === 'insecure'
                      ? 'bg-neutral-900/60 border-rose-900/40 hover:border-rose-800/60'
                      : h.securityRating === 'deprecated'
                      ? 'bg-neutral-900/60 border-amber-900/40 hover:border-amber-800/60'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-indigo-900/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white font-mono">
                        {h.algorithm}
                      </span>
                      {h.securityRating === 'secure' && (
                        <span className="text-[11px] text-emerald-400 font-medium">· NIST Standard</span>
                      )}
                      {h.securityRating === 'deprecated' && (
                        <span className="text-[11px] text-amber-400 font-medium">· Obsolete for security</span>
                      )}
                      {h.securityRating === 'insecure' && (
                        <span className="text-[11px] text-rose-400 font-medium">· Insecure (collision broken)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {h.timingMs !== undefined && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {h.timingMs.toFixed(2)}ms
                        </span>
                      )}

                      <button
                        onClick={() => handleCopy(h.hex, h.algorithm)}
                        className={`px-2.5 py-0.5 text-xs rounded transition-all ${
                          copiedKey === h.algorithm
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                        }`}
                      >
                        {copiedKey === h.algorithm ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 font-mono text-xs text-indigo-200/90 break-all select-all">
                    {h.hex || <span className="text-neutral-600">Enter input...</span>}
                  </div>

                  {h.warning && (
                    <div className="mt-2 text-[11px] text-neutral-400 leading-relaxed">
                      {h.warning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: HMAC Signer */}
      {tab === 'hmac' && (
        <div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-200">HMAC Configuration</span>
            {hmacTiming > 0 && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {hmacTiming.toFixed(2)}ms
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-400">Algorithm</label>
              <select
                value={hmacAlgo}
                onChange={(e) => setHmacAlgo(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="SHA-256">HMAC-SHA-256</option>
                <option value="SHA-512">HMAC-SHA-512</option>
                <option value="SHA-384">HMAC-SHA-384</option>
                <option value="SHA-1">HMAC-SHA-1</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400">Format</label>
              <select
                value={hmacFormat}
                onChange={(e) => setHmacFormat(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="hex">Hexadecimal</option>
                <option value="base64">Base64</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400">Secret Key</label>
              <input
                type="text"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                placeholder="Secret key..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300">Generated HMAC Signature</span>
              <button
                onClick={() => handleCopy(hmacResult, 'hmac')}
                disabled={!hmacResult}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  copiedKey === 'hmac'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 disabled:opacity-40'
                }`}
              >
                {copiedKey === 'hmac' ? 'Copied' : 'Copy Signature'}
              </button>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-xs text-indigo-300 break-all select-all">
              {hmacResult || <span className="text-neutral-600">Enter payload and key above...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
