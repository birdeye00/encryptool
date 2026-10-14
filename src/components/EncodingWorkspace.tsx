import React, { useState, useEffect, useMemo } from 'react';
import { ToolDefinition, OperationMode } from '../types';
import {
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  encodeUrl,
  decodeUrl,
  encodeHtmlEntities,
  decodeHtmlEntities,
  encodeHex,
  decodeHex,
  encodeBinary,
  decodeBinary,
  escapeJsonString,
  unescapeJsonString,
  formatJson,
  caesarCipher,
  rot13,
} from '../utils/encoders';

interface EncodingWorkspaceProps {
  tool: ToolDefinition;
}

export const EncodingWorkspace: React.FC<EncodingWorkspaceProps> = ({ tool }) => {
  const [mode, setMode] = useState<OperationMode>('encode');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Tool Specific Options
  const [hexDelimiter, setHexDelimiter] = useState<'none' | 'space' | 'colon' | '0x'>('none');
  const [hexUppercase, setHexUppercase] = useState<boolean>(false);
  
  const [urlMode, setUrlMode] = useState<'component' | 'fullUrl'>('component');
  const [urlRfc3986, setUrlRfc3986] = useState<boolean>(true);

  const [htmlFormat, setHtmlFormat] = useState<'named' | 'decimal' | 'hex'>('named');
  const [htmlAllChars, setHtmlAllChars] = useState<boolean>(false);

  const [binarySpaces, setBinarySpaces] = useState<boolean>(true);
  
  const [caesarShift, setCaesarShift] = useState<number>(3);

  const [jsonIndent, setJsonIndent] = useState<2 | 4 | 'tab' | 'minify'>(2);
  const [jsonMode, setJsonMode] = useState<'string-escape' | 'pretty-format'>('string-escape');

  // Reset input when switching tools
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, [tool.id]);

  // Compute transformation
  useEffect(() => {
    setError(null);
    if (!input) {
      setOutput('');
      return;
    }

    try {
      let res = '';
      switch (tool.id) {
        case 'base64':
          res = mode === 'encode' ? encodeBase64(input) : decodeBase64(input);
          break;
        case 'base64url':
          res = mode === 'encode' ? encodeBase64Url(input) : decodeBase64Url(input);
          break;
        case 'url-percent':
          res = mode === 'encode' 
            ? encodeUrl(input, { mode: urlMode, rfc3986: urlRfc3986 }) 
            : decodeUrl(input, urlMode);
          break;
        case 'html-entities':
          res = mode === 'encode'
            ? encodeHtmlEntities(input, htmlFormat, htmlAllChars)
            : decodeHtmlEntities(input);
          break;
        case 'hex':
          res = mode === 'encode'
            ? encodeHex(input, hexDelimiter, hexUppercase)
            : decodeHex(input);
          break;
        case 'binary':
          res = mode === 'encode'
            ? encodeBinary(input, binarySpaces)
            : decodeBinary(input);
          break;
        case 'json-escape':
          if (jsonMode === 'string-escape') {
            res = mode === 'encode' ? escapeJsonString(input) : unescapeJsonString(input);
          } else {
            res = formatJson(input, jsonIndent);
          }
          break;
        case 'caesar':
          res = caesarCipher(input, caesarShift, mode === 'decode');
          break;
        case 'rot13':
          res = rot13(input);
          break;
        default:
          res = input;
      }
      setOutput(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutput('');
    }
  }, [
    input,
    mode,
    tool.id,
    hexDelimiter,
    hexUppercase,
    urlMode,
    urlRfc3986,
    htmlFormat,
    htmlAllChars,
    binarySpaces,
    caesarShift,
    jsonIndent,
    jsonMode,
  ]);

  // Statistics
  const inputStats = useMemo(() => {
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;
    const bytes = new TextEncoder().encode(input).length;
    return { chars, lines, bytes };
  }, [input]);

  const outputStats = useMemo(() => {
    const chars = output.length;
    const lines = output ? output.split('\n').length : 0;
    const bytes = new TextEncoder().encode(output).length;
    return { chars, lines, bytes };
  }, [output]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSwap = () => {
    if (!tool.isReversible && tool.id !== 'rot13') return;
    setInput(output);
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
  };

  const handleDownload = () => {
    if (!output) return;
    const extension = tool.id === 'json-escape' && jsonMode === 'pretty-format' ? 'json' : 'txt';
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}_${mode}_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            {tool.name}
          </h1>
        </div>

        {/* Encode / Decode Segmented Tabs */}
        {tool.isReversible && (
          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setMode('encode')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === 'encode'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode('decode')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === 'decode'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Decode
            </button>
          </div>
        )}
      </div>

      {/* Security notice banner if applicable */}
      {tool.securityNotice && (
        <div className="px-3.5 py-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90">
          <span className="font-semibold text-amber-300">Notice: </span>
          {tool.securityNotice}
        </div>
      )}

      {/* Options Bar - only rendered for tools with configurable settings */}
      {((tool.id === 'hex') ||
        (tool.id === 'url-percent') ||
        (tool.id === 'html-entities' && mode === 'encode') ||
        (tool.id === 'binary') ||
        (tool.id === 'caesar') ||
        (tool.id === 'json-escape')) && (
        <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs">
          <span className="text-neutral-400 font-medium">Options:</span>

          {tool.id === 'hex' && (
            <>
              <label className="flex items-center gap-1.5 text-neutral-300">
                Delimiter:
                <select
                  value={hexDelimiter}
                  onChange={(e) => setHexDelimiter(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="space">Space</option>
                  <option value="colon">Colon</option>
                  <option value="0x">0x Prefix</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hexUppercase}
                  onChange={(e) => setHexUppercase(e.target.checked)}
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                Uppercase
              </label>
            </>
          )}

          {tool.id === 'url-percent' && (
            <>
              <label className="flex items-center gap-1.5 text-neutral-300">
                Mode:
                <select
                  value={urlMode}
                  onChange={(e) => setUrlMode(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="component">Component (encodeURIComponent)</option>
                  <option value="fullUrl">Full URL (encodeURI)</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlRfc3986}
                  onChange={(e) => setUrlRfc3986(e.target.checked)}
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                Strict RFC 3986
              </label>
            </>
          )}

          {tool.id === 'html-entities' && mode === 'encode' && (
            <>
              <label className="flex items-center gap-1.5 text-neutral-300">
                Format:
                <select
                  value={htmlFormat}
                  onChange={(e) => setHtmlFormat(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="named">Named (&amp;amp;, &amp;lt;)</option>
                  <option value="decimal">Decimal (&amp;#38;)</option>
                  <option value="hex">Hex (&amp;#x26;)</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={htmlAllChars}
                  onChange={(e) => setHtmlAllChars(e.target.checked)}
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                All characters
              </label>
            </>
          )}

          {tool.id === 'binary' && (
            <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={binarySpaces}
                onChange={(e) => setBinarySpaces(e.target.checked)}
                className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
              />
              Byte spaces
            </label>
          )}

          {tool.id === 'caesar' && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-300">Shift Key: {caesarShift}</span>
              <input
                type="range"
                min="1"
                max="25"
                value={caesarShift}
                onChange={(e) => setCaesarShift(Number(e.target.value))}
                className="w-28 accent-indigo-500"
              />
            </div>
          )}

          {tool.id === 'json-escape' && (
            <>
              <label className="flex items-center gap-1.5 text-neutral-300">
                Operation:
                <select
                  value={jsonMode}
                  onChange={(e) => setJsonMode(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="string-escape">String Literal (Escape / Unescape)</option>
                  <option value="pretty-format">Format &amp; Minify JSON</option>
                </select>
              </label>
              {jsonMode === 'pretty-format' && (
                <label className="flex items-center gap-1.5 text-neutral-300">
                  Indent:
                  <select
                    value={jsonIndent}
                    onChange={(e) => setJsonIndent(e.target.value === 'tab' ? 'tab' : e.target.value === 'minify' ? 'minify' : Number(e.target.value) as any)}
                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                    <option value="tab">Tab</option>
                    <option value="minify">Minify</option>
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 font-mono">
          {error}
        </div>
      )}

      {/* Input / Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Input Panel */}
        <div className="flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
            <div className="flex items-center gap-2 text-neutral-300 font-medium">
              <span>Input</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {inputStats.chars} chars · {inputStats.bytes} B
              </span>
            </div>
            <button
              onClick={() => setInput('')}
              className="px-2 py-0.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input string..."
            className="flex-1 w-full p-3 sm:p-4 bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed min-h-[140px] sm:min-h-[180px] lg:min-h-[240px]"
            rows={8}
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs gap-2">
            <div className="flex items-center gap-2 text-neutral-300 font-medium">
              <span>Output</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {outputStats.chars} chars · {outputStats.bytes} B
              </span>
            </div>

            <div className="flex items-center gap-2">
              {tool.isReversible && (
                <button
                  onClick={handleSwap}
                  className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer"
                >
                  Swap
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={!output}
                className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors disabled:opacity-40 cursor-pointer"
              >
                Download
              </button>

              <button
                onClick={handleCopy}
                disabled={!output}
                className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 disabled:opacity-40'
                }`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Result will appear here..."
            className="flex-1 w-full p-3 sm:p-4 bg-transparent text-xs font-mono text-indigo-100/90 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed min-h-[140px] sm:min-h-[180px] lg:min-h-[240px]"
            rows={8}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
