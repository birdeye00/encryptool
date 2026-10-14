import React, { useState, useMemo } from 'react';
import { detectString, analyzeString, DetectionMatch } from '../utils/detector';
import { ToolId } from '../types';

interface DetectionWorkspaceProps {
  onSelectTool?: (toolId: ToolId) => void;
}

export const DetectionWorkspace: React.FC<DetectionWorkspaceProps> = ({ onSelectTool }) => {
  const [input, setInput] = useState<string>('');
  const [copiedDecoded, setCopiedDecoded] = useState<boolean>(false);

  const analysis = useMemo(() => analyzeString(input), [input]);
  const matches = useMemo(() => detectString(input), [input]);

  const primaryMatch: DetectionMatch | null = matches.length > 0 ? matches[0] : null;
  const secondaryMatches: DetectionMatch[] = matches.length > 1 ? matches.slice(1) : [];

  const handleCopyDecoded = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDecoded(true);
    setTimeout(() => setCopiedDecoded(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            Hash &amp; Encoding Detector
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            Paste
          </button>
          <button
            onClick={() => setInput('')}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Input Box with Realtime Metrics */}
      <div className="flex flex-col bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
        <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-medium text-neutral-200">Unknown String, Ciphertext, or Hash</span>
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
            {analysis.length} chars · {analysis.byteLength} bytes{analysis.bitLength > 0 ? ` · ${analysis.bitLength} bits` : ''}
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type any unidentified hash, base64 payload, hex string, JWT token, or ciphertext..."
          rows={4}
          className="w-full p-3.5 sm:p-4 bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-hidden resize-y leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Detection Results */}
      {input.trim().length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-neutral-800/80 rounded-xl bg-neutral-900/20 text-center">
          <p className="text-sm font-medium text-neutral-300">Enter or paste a string to detect its format</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md">
            Identifies SHA-256, SHA-512, MD5, SHA-1, bcrypt, Argon2, JWT tokens, Base64, Hex bytes, URL encoding, HTML entities, and binary bitstreams.
          </p>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-6 border border-neutral-800 rounded-xl bg-neutral-900/30">
          <h3 className="text-sm font-semibold text-neutral-200">No Definite Hash or Encoding Match</h3>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            The input does not match standardized cryptographic hash signatures, known Unix crypt prefixes, or standard binary-to-text encoding patterns.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Primary Match Spotlight Card */}
          {primaryMatch && (
            <div className="border border-indigo-500/30 bg-neutral-900/80 rounded-xl overflow-hidden shadow-xs shadow-indigo-950/20">
              <div className="px-4 py-3 bg-indigo-950/30 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Primary Detection
                  </span>
                  <span className="text-xs text-neutral-400">·</span>
                  <span className="text-xs text-neutral-300 font-medium capitalize">
                    {primaryMatch.category.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  {primaryMatch.bitLength && (
                    <span>
                      Bit Length: <strong className="text-neutral-200 font-mono tabular-nums font-normal">{primaryMatch.bitLength}-bit</strong>
                    </span>
                  )}
                  {primaryMatch.securityRating && (
                    <>
                      <span>·</span>
                      <span className={
                        primaryMatch.securityRating === 'secure' ? 'text-emerald-400' :
                        primaryMatch.securityRating === 'deprecated' ? 'text-amber-400' :
                        primaryMatch.securityRating === 'insecure' ? 'text-rose-400' : 'text-neutral-400'
                      }>
                        {primaryMatch.securityRating === 'secure' ? 'Cryptographically Secure' :
                         primaryMatch.securityRating === 'deprecated' ? 'Deprecated / Collision Vulnerable' :
                         primaryMatch.securityRating === 'insecure' ? 'Insecure' : 'Information'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    {primaryMatch.name}
                  </h2>
                </div>

                {/* Instant Decoded Preview for Encodings */}
                {primaryMatch.decodedPreview && (
                  <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-neutral-300">Decoded Content Preview:</span>
                      <button
                        onClick={() => handleCopyDecoded(primaryMatch.decodedPreview!)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {copiedDecoded ? 'Copied!' : 'Copy Decoded'}
                      </button>
                    </div>
                    <pre className="p-2.5 bg-neutral-900 border border-neutral-800/80 rounded-md text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre-wrap break-all max-h-48">
                      {primaryMatch.decodedPreview}
                    </pre>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Alternative Possibilities */}
          {secondaryMatches.length > 0 && (
            <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Alternative Possibilities ({secondaryMatches.length})
              </h3>
              <div className="divide-y divide-neutral-800/70">
                {secondaryMatches.map((alt, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-200">{alt.name}</span>
                        <span className="text-xs text-neutral-500">·</span>
                        <span className="text-xs text-neutral-400 capitalize">{alt.category}</span>
                        {alt.bitLength && (
                          <>
                            <span className="text-xs text-neutral-500">·</span>
                            <span className="text-xs text-neutral-400 font-mono">{alt.bitLength}-bit</span>
                          </>
                        )}
                      </div>
                    </div>

                    {alt.targetToolId && onSelectTool && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onSelectTool(alt.targetToolId!)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          Switch to tool →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
