import React, { useState, useMemo } from 'react';
import { analyzeUnicode, inspectAscii, encodeUnicodeEscapes, decodeUnicodeEscapes } from '../utils/encoders';

interface UnicodeInspectorProps {
  initialType?: 'unicode' | 'ascii';
}

export const UnicodeInspector: React.FC<UnicodeInspectorProps> = ({ initialType = 'unicode' }) => {
  const [activeTab, setActiveTab] = useState<'unicode' | 'ascii'>(initialType);
  const [input, setInput] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [escapeStyle, setEscapeStyle] = useState<'u16' | 'u32_braces'>('u16');

  const unicodeDetails = useMemo(() => {
    return analyzeUnicode(input);
  }, [input]);

  const asciiRows = useMemo(() => {
    return inspectAscii(input);
  }, [input]);

  const escapedString = useMemo(() => {
    return encodeUnicodeEscapes(input, escapeStyle);
  }, [input, escapeStyle]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleUnescapeFromInput = () => {
    try {
      const decoded = decodeUnicodeEscapes(input);
      setInput(decoded);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            Unicode, UTF-8 &amp; ASCII Inspector
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('unicode')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'unicode'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Unicode &amp; UTF-8
          </button>
          <button
            onClick={() => setActiveTab('ascii')}
            className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'ascii'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ASCII Table
          </button>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/40 transition-colors">
        <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-300">Input String</span>
            <span className="text-[11px] font-mono text-neutral-500">
              {input.length} characters · {new TextEncoder().encode(input).length} bytes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInput('')}
              className="text-xs text-neutral-400 hover:text-neutral-200 px-2.5 py-1 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter characters to inspect..."
          className="w-full p-3 sm:p-4 bg-transparent text-sm font-mono text-neutral-200 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed"
          rows={2}
          spellCheck={false}
        />
      </div>

      {/* Escape sequences preview */}
      {activeTab === 'unicode' && (
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <span className="font-semibold text-neutral-200">
              Unicode Escape Sequences
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                Format:
                <select
                  value={escapeStyle}
                  onChange={(e) => setEscapeStyle(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="u16">\uXXXX</option>
                  <option value="u32_braces">\u&#123;XXXX&#125;</option>
                </select>
              </label>

              <button
                onClick={handleUnescapeFromInput}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Unescape input
              </button>

              <button
                onClick={() => handleCopy(escapedString, 'escape')}
                className="px-2.5 py-0.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-xs shadow-indigo-600/30 cursor-pointer"
              >
                {copiedKey === 'escape' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono text-sky-300/90 break-all select-all">
            {escapedString || <span className="text-neutral-600">No characters...</span>}
          </div>
        </div>
      )}

      {/* Unicode Table */}
      {activeTab === 'unicode' && (
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs font-semibold text-neutral-300">
            Byte Breakdown
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-950 sticky top-0 text-neutral-400 border-b border-neutral-800 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Glyph</th>
                  <th className="py-2.5 px-4 font-medium">Code Point</th>
                  <th className="py-2.5 px-4 font-medium">UTF-8 Hex</th>
                  <th className="py-2.5 px-4 font-medium">UTF-8 Binary</th>
                  <th className="py-2.5 px-4 font-medium">UTF-8 Dec</th>
                  <th className="py-2.5 px-4 font-medium">UTF-16 Escape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {unicodeDetails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      Enter characters in input to inspect
                    </td>
                  </tr>
                ) : (
                  unicodeDetails.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2 px-4 text-base font-sans text-white font-semibold">
                        {item.character}
                      </td>
                      <td className="py-2 px-4 text-sky-400 font-medium">{item.hexCodePoint}</td>
                      <td className="py-2 px-4 text-indigo-300">{item.utf8Hex}</td>
                      <td className="py-2 px-4 text-neutral-400 text-[11px]">{item.utf8Binary}</td>
                      <td className="py-2 px-4 text-neutral-400">[{item.utf8Decimal.join(', ')}]</td>
                      <td className="py-2 px-4 text-amber-300/90 text-[11px]">{item.utf16Hex}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASCII Table */}
      {activeTab === 'ascii' && (
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span>ASCII Table</span>
            <span className="text-[11px] text-neutral-400 font-mono">
              Values &gt; 127 are non-standard/multibyte
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-950 sticky top-0 text-neutral-400 border-b border-neutral-800 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Char</th>
                  <th className="py-2.5 px-4 font-medium">Dec</th>
                  <th className="py-2.5 px-4 font-medium">Hex</th>
                  <th className="py-2.5 px-4 font-medium">Octal</th>
                  <th className="py-2.5 px-4 font-medium">Binary</th>
                  <th className="py-2.5 px-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {asciiRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      Enter characters in input to view ASCII representations
                    </td>
                  </tr>
                ) : (
                  asciiRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-2 px-4 text-base font-sans font-semibold text-white">
                        {row.char}
                      </td>
                      <td className="py-2 px-4 text-sky-400 font-medium">{row.dec}</td>
                      <td className="py-2 px-4 text-indigo-300">{row.hex}</td>
                      <td className="py-2 px-4 text-neutral-400">{row.oct}</td>
                      <td className="py-2 px-4 text-neutral-400 text-[11px]">{row.bin}</td>
                      <td className="py-2 px-4 font-sans text-neutral-300 text-xs">{row.desc}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
