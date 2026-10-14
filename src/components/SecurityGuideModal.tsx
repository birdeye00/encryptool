import React from 'react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-xl overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-guide-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-neutral-800 bg-neutral-900/90 gap-2">
          <div>
            <h2 id="security-guide-title" className="text-xs sm:text-sm font-semibold text-white">
              Security Reference: Encoding vs. Encryption vs. Hashing
            </h2>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">
              Core architectural distinctions in data representation
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-neutral-300">
          {/* Critical Callout */}
          <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-1">
            <div className="font-semibold text-amber-300">
              Rule 1: Encoding is NEVER Encryption
            </div>
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              Base64, Hex, URL percent-encoding, and HTML entities provide zero secrecy. Anyone who receives an encoded string can decode it without a password or cryptographic key.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-sky-900/40 space-y-2">
              <div className="font-semibold text-sky-400">1. Encoding</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Transforms data between character sets or binary representations for protocol transport.
              </p>
              <div className="text-[11px] space-y-1 pt-2 border-t border-neutral-800 text-neutral-400">
                <div><span className="text-neutral-200">Reversible:</span> Yes</div>
                <div><span className="text-neutral-200">Secret Key:</span> None</div>
                <div><span className="text-neutral-200">Examples:</span> Base64, Hex, UTF-8</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-emerald-900/40 space-y-2">
              <div className="font-semibold text-emerald-400">2. Encryption</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Protects confidentiality using cryptographic algorithms and private keys.
              </p>
              <div className="text-[11px] space-y-1 pt-2 border-t border-neutral-800 text-neutral-400">
                <div><span className="text-neutral-200">Reversible:</span> Yes (with key)</div>
                <div><span className="text-neutral-200">Secret Key:</span> Required</div>
                <div><span className="text-neutral-200">Examples:</span> AES-GCM, RSA</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-indigo-900/40 space-y-2">
              <div className="font-semibold text-indigo-400">3. Hashing</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                One-way mathematical digest of fixed length used to verify data integrity.
              </p>
              <div className="text-[11px] space-y-1 pt-2 border-t border-neutral-800 text-neutral-400">
                <div><span className="text-neutral-200">Reversible:</span> No (one-way)</div>
                <div><span className="text-neutral-200">Secret Key:</span> Optional (HMAC)</div>
                <div><span className="text-neutral-200">Examples:</span> SHA-256, SHA-512</div>
              </div>
            </div>
          </div>

          {/* Hash status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-200">Hash Algorithm Security Status</h3>
            <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg bg-neutral-900/40 overflow-hidden">
              <div className="p-3.5">
                <div className="font-medium text-emerald-300">
                  SHA-256 &amp; SHA-512 · Recommended Standard
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  NIST FIPS 180-4 standard. Strong collision resistance for TLS, software signing, and data integrity verification.
                </p>
              </div>

              <div className="p-3.5">
                <div className="font-medium text-amber-300">
                  SHA-1 · Obsolete for Security
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Broken by practical collision attacks in 2017 (SHAttered). Obsolete for digital signatures and TLS certificates.
                </p>
              </div>

              <div className="p-3.5">
                <div className="font-medium text-rose-300">
                  MD5 · Insecure / Collision Broken
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Severely vulnerable to collision attacks. Do not use for passwords or adversarial integrity checks. Useful only for basic corruption checks.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy statement */}
          <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-[11px] text-neutral-300">
            <strong className="text-indigo-300">Local Execution Guarantee:</strong> All inputs, files, and keys are processed entirely in your browser using the Web Crypto API. No data is transmitted to external servers.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-xs shadow-indigo-600/30"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
