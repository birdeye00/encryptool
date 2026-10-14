import React, { useState, useEffect } from 'react';
import { QueryParamPair } from '../types';

export const QueryStringWorkspace: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>('');
  const [params, setParams] = useState<QueryParamPair[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [encodeValues, setEncodeValues] = useState<boolean>(true);

  // Parse input into params
  useEffect(() => {
    let clean = rawInput.trim();
    if (!clean) {
      setParams([]);
      return;
    }

    if (clean.includes('?')) {
      const parts = clean.split('?');
      setBaseUrl(parts[0]);
      clean = parts[1];
    }

    try {
      const searchParams = new URLSearchParams(clean);
      const list: QueryParamPair[] = [];
      searchParams.forEach((value, key) => {
        list.push({
          id: Math.random().toString(36).substring(2, 9),
          key,
          value,
          enabled: true,
        });
      });
      setParams(list);
    } catch {
      const pairs = clean.split('&');
      const list: QueryParamPair[] = pairs.map((p) => {
        const [k, v = ''] = p.split('=');
        return {
          id: Math.random().toString(36).substring(2, 9),
          key: decodeURIComponent(k || ''),
          value: decodeURIComponent(v || ''),
          enabled: true,
        };
      });
      setParams(list);
    }
  }, [rawInput]);

  const addParam = () => {
    setParams([
      ...params,
      {
        id: Math.random().toString(36).substring(2, 9),
        key: '',
        value: '',
        enabled: true,
      },
    ]);
  };

  const removeParam = (id: string) => {
    setParams(params.filter((p) => p.id !== id));
  };

  const updateParam = (id: string, updates: Partial<QueryParamPair>) => {
    setParams(params.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const sortParams = () => {
    setParams([...params].sort((a, b) => a.key.localeCompare(b.key)));
  };

  const { queryString, fullUrl } = React.useMemo(() => {
    const active = params.filter((p) => p.enabled && p.key.trim().length > 0);
    const parts = active.map((p) => {
      const k = encodeValues ? encodeURIComponent(p.key) : p.key;
      const v = encodeValues ? encodeURIComponent(p.value) : p.value;
      return `${k}=${v}`;
    });
    const qs = parts.join('&');
    const full = baseUrl ? `${baseUrl}${qs ? '?' + qs : ''}` : qs;
    return { queryString: qs, fullUrl: full };
  }, [params, baseUrl, encodeValues]);

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
            Query String Parser &amp; URL Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRawInput('');
              setParams([]);
            }}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Raw Input Box */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden focus-within:border-indigo-500/40 transition-colors">
        <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-1">
          <span className="font-medium text-neutral-300">Input URL or Query String</span>
          <span className="text-[11px] font-mono text-neutral-500">
            Auto-parses on edit
          </span>
        </div>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Paste full URL or query string..."
          className="w-full p-3 sm:p-4 bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-600 resize-none focus:outline-hidden leading-relaxed"
          rows={2}
          spellCheck={false}
        />
      </div>

      {/* Parameter Table */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-200">Parameter Table</span>
            <span className="text-[11px] text-neutral-400">({params.length} pairs)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={sortParams}
              className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors cursor-pointer"
            >
              Sort A-Z
            </button>
            <button
              onClick={addParam}
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded transition-all shadow-xs shadow-indigo-600/30 cursor-pointer"
            >
              Add Parameter
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="p-3 sm:p-3.5 space-y-2 max-h-80 overflow-y-auto">
          {params.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-500">
              No parameters present. Click &quot;Add Parameter&quot; or paste a query string above.
            </div>
          ) : (
            params.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-2 rounded-lg border transition-colors ${
                  p.enabled
                    ? 'bg-neutral-950 border-neutral-800/80'
                    : 'bg-neutral-950/40 border-neutral-850 opacity-40'
                }`}
              >
                <div className="flex items-center gap-2 w-full sm:w-2/5">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => updateParam(p.id, { enabled: e.target.checked })}
                    className="rounded border-neutral-700 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                    title="Toggle parameter"
                  />

                  <input
                    type="text"
                    value={p.key}
                    onChange={(e) => updateParam(p.id, { key: e.target.value })}
                    placeholder="Key"
                    className="flex-1 px-2.5 py-1 text-xs font-mono bg-neutral-900 border border-neutral-700 rounded text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <span className="hidden sm:inline text-neutral-500 font-mono text-xs">=</span>

                <div className="flex items-center gap-2 w-full sm:flex-1">
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => updateParam(p.id, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-2.5 py-1 text-xs font-mono bg-neutral-900 border border-neutral-700 rounded text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />

                  <button
                    onClick={() => removeParam(p.id)}
                    className="px-2.5 py-1 text-xs text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors shrink-0 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reconstructed Output */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-200">Reconstructed URL</span>
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={encodeValues}
              onChange={(e) => setEncodeValues(e.target.checked)}
              className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
            />
            URL-encode values (RFC 3986)
          </label>
        </div>

        {/* Full URL */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Full URL</span>
            <button
              onClick={() => handleCopy(fullUrl, 'full')}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {copiedKey === 'full' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-200 break-all select-all">
            {fullUrl || <span className="text-neutral-600">No parameters...</span>}
          </div>
        </div>

        {/* Query String only */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Query String Only</span>
            <button
              onClick={() => handleCopy(queryString, 'qs')}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              {copiedKey === 'qs' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono text-amber-300/90 break-all select-all">
            {queryString || <span className="text-neutral-600">Empty...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
