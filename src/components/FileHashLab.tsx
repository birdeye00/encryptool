import React, { useState, useRef } from 'react';
import { computeHash, compareHashes } from '../utils/crypto';
import { HashResult } from '../types';

export const FileHashLab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [expectedChecksum, setExpectedChecksum] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(15);
    setHashes([]);

    try {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 60));
        }
      };

      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer;
        setProgress(70);

        const algos: Array<{ id: 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1' | 'MD5'; name: string; rating: 'secure' | 'deprecated' | 'insecure'; warning?: string }> = [
          { id: 'SHA-256', name: 'SHA-256', rating: 'secure' },
          { id: 'SHA-512', name: 'SHA-512', rating: 'secure' },
          { id: 'SHA-384', name: 'SHA-384', rating: 'secure' },
          { id: 'SHA-1', name: 'SHA-1', rating: 'deprecated', warning: 'Broken collision resistance. Obsolete for security verification.' },
          { id: 'MD5', name: 'MD5', rating: 'insecure', warning: 'Insecure. High collision vulnerability. Do not use for security.' },
        ];

        const computedList: HashResult[] = [];

        for (let i = 0; i < algos.length; i++) {
          const item = algos[i];
          const t0 = performance.now();
          const hex = await computeHash(item.id, buffer);
          const timingMs = performance.now() - t0;

          computedList.push({
            algorithm: item.name,
            hex,
            timingMs,
            securityRating: item.rating,
            warning: item.warning,
          });

          setProgress(70 + Math.round(((i + 1) / algos.length) * 30));
        }

        setHashes(computedList);
        setIsProcessing(false);
        setProgress(100);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadChecksumFile = () => {
    if (!file || hashes.length === 0) return;
    let content = `# Checksums generated for: ${file.name} (${formatFileSize(file.size)})\n`;
    content += `# Generated: ${new Date().toISOString()}\n\n`;

    for (const h of hashes) {
      content += `${h.hex}  *${file.name}  # ${h.algorithm}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.checksums.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setHashes([]);
    setProgress(0);
    setExpectedChecksum('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const verificationResult = React.useMemo(() => {
    if (!expectedChecksum.trim() || hashes.length === 0) return null;
    for (const h of hashes) {
      const cmp = compareHashes(h.hex, expectedChecksum);
      if (cmp.isMatch) {
        return {
          matches: true,
          algorithm: h.algorithm,
        };
      }
    }
    return {
      matches: false,
      algorithm: null,
    };
  }, [expectedChecksum, hashes]);

  return (
    <div className="flex-1 flex flex-col min-h-0 md:h-[calc(100vh-3.5rem)] overflow-y-auto bg-neutral-950 p-3 sm:p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-100">
            File Checksum
          </h1>
        </div>

        {file && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadChecksumFile}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-all shadow-xs shadow-indigo-600/30 cursor-pointer"
            >
              Export Checksums
            </button>
            <button
              onClick={clearFile}
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              Remove File
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Area */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-12 border border-dashed rounded-xl cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-neutral-800 hover:border-indigo-500/50 bg-neutral-900/40 hover:bg-neutral-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <p className="text-sm font-semibold text-neutral-200">
            Select a file or drag &amp; drop here
          </p>
          <p className="text-xs text-indigo-400 mt-1">
            Data is read strictly into local memory
          </p>
        </div>
      ) : (
        /* File Info Card */
        <div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 break-all">{file.name}</h3>
              <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-indigo-300 font-mono">{formatFileSize(file.size)}</span>
                <span>·</span>
                <span>{file.type || 'Binary Stream'}</span>
                <span>·</span>
                <span>Modified: {new Date(file.lastModified).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-indigo-300 hover:text-white px-2.5 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 rounded transition-colors self-start sm:self-auto cursor-pointer"
            >
              Change File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                <span>Computing digests in memory...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Input */}
      {file && (
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-200">
              Verify Against Expected Release Checksum
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              Matches SHA-256, SHA-512, SHA-384, SHA-1, MD5
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={expectedChecksum}
              onChange={(e) => setExpectedChecksum(e.target.value)}
              placeholder="Paste release checksum to verify..."
              className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
            />
            {expectedChecksum && (
              <button
                onClick={() => setExpectedChecksum('')}
                className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>

          {expectedChecksum.trim() && verificationResult && (
            <div
              className={`px-3 py-2 rounded-lg text-xs font-medium ${
                verificationResult.matches
                  ? 'bg-emerald-950/50 border border-emerald-600 text-emerald-200'
                  : 'bg-rose-950/50 border border-rose-600 text-rose-200'
              }`}
            >
              {verificationResult.matches ? (
                <span>
                  <strong>Match:</strong> Checksum matches calculated <span className="font-mono underline">{verificationResult.algorithm}</span> digest.
                </span>
              ) : (
                <span>
                  <strong>Mismatch:</strong> Checksum does not match any computed digest for this file.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Computed Hashes */}
      {hashes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-300 px-1">
            Computed File Checksums
          </h2>

          <div className="space-y-3">
            {hashes.map((h) => {
              const isMatch =
                expectedChecksum.trim() &&
                compareHashes(h.hex, expectedChecksum).isMatch;

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
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white font-mono">
                        {h.algorithm}
                      </span>
                      {h.securityRating === 'secure' && (
                        <span className="text-[11px] text-emerald-400 font-medium">· Standard</span>
                      )}
                      {h.securityRating === 'deprecated' && (
                        <span className="text-[11px] text-amber-400 font-medium">· Obsolete</span>
                      )}
                      {h.securityRating === 'insecure' && (
                        <span className="text-[11px] text-rose-400 font-medium">· Insecure</span>
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

                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-xs text-indigo-200/90 break-all select-all">
                    {h.hex}
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
    </div>
  );
};
