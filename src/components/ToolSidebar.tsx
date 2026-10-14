import React from 'react';
import { ToolDefinition, ToolId, ToolCategory } from '../types';
import { X, Search } from 'lucide-react';

export const ALL_TOOLS: ToolDefinition[] = [
  // Detection
  {
    id: 'detector',
    name: 'Hash & Encoding Detector',
    category: 'detection',
    description: 'Detect hash algorithms and encoding schemes from unknown ciphertext or encoded strings.',
    isReversible: false,
    isCryptographic: false,
  },

  // Reversible Encodings
  {
    id: 'base64',
    name: 'Base64',
    category: 'reversible',
    description: 'RFC 4648 standard Base64 encode and decode with UTF-8 Unicode support.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'base64url',
    name: 'Base64URL',
    category: 'reversible',
    description: 'URL-safe Base64 without + or / symbols and optional trailing padding.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'url-percent',
    name: 'URL Percent',
    category: 'reversible',
    description: 'Percent-encode or decode URI parameters with RFC 3986 compliance.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'html-entities',
    name: 'HTML Entities',
    category: 'reversible',
    description: 'Escape characters (&, <, >, ", \') into named, decimal, or hex entities.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'hex',
    name: 'Hexadecimal',
    category: 'reversible',
    description: 'Hex encode or decode raw bytes with configurable byte delimiters.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'binary',
    name: 'Binary (8-bit)',
    category: 'reversible',
    description: 'Convert characters to and from 8-bit binary strings.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'unicode',
    name: 'Unicode & ASCII Inspector',
    category: 'reversible',
    description: 'Inspect UTF-8 byte sequences, code points, surrogate pairs, and ASCII table.',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'json-escape',
    name: 'JSON Escape / Format',
    category: 'reversible',
    description: 'Escape string literals for JSON payloads or pretty-print/minify JSON.',
    isReversible: true,
    isCryptographic: false,
  },

  // Token & Data Parsers
  {
    id: 'jwt-inspector',
    name: 'JWT Inspector',
    category: 'tokens-data',
    description: 'Decode Base64URL header and payload claims with timestamp verification.',
    isReversible: false,
    isCryptographic: false,
  },
  {
    id: 'query-string',
    name: 'Query String Builder',
    category: 'tokens-data',
    description: 'Parse URL query parameters into editable pairs and rebuild clean URLs.',
    isReversible: true,
    isCryptographic: false,
  },

  // Ciphers
  {
    id: 'caesar',
    name: 'Caesar Cipher',
    category: 'ciphers',
    description: 'Educational substitution toy cipher with shift key (1-25).',
    isReversible: true,
    isCryptographic: false,
  },
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'ciphers',
    description: 'Classic shift-13 reciprocal cipher.',
    isReversible: true,
    isCryptographic: false,
  },

  // Cryptographic Hashes
  {
    id: 'hash-generator',
    name: 'Cryptographic Hashes & HMAC',
    category: 'hashes',
    description: 'Compute SHA-256, SHA-512, SHA-384, SHA-1, MD5 digests and keyed HMAC signatures.',
    isReversible: false,
    isCryptographic: true,
  },
  {
    id: 'file-hasher',
    name: 'File Checksum',
    category: 'file-checksum',
    description: 'Compute and verify checksums for local files directly in browser memory.',
    isReversible: false,
    isCryptographic: true,
  },
];

interface ToolSidebarProps {
  activeToolId: ToolId;
  onSelectTool: (id: ToolId) => void;
  currentCategory: ToolCategory;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeToolId,
  onSelectTool,
  currentCategory,
  searchQuery,
  onSearchChange,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory =
      currentCategory === 'all' ||
      tool.category === currentCategory ||
      (tool.id === 'detector' && (currentCategory === 'hashes' || currentCategory === 'reversible'));
    const matchesSearch =
      searchQuery === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToolClick = (toolId: ToolId) => {
    onSelectTool(toolId);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const renderToolList = () => (
    <>
      {/* Search Input */}
      <div className="p-3 border-b border-neutral-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search utilities..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredTools.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500">
            No utilities match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredTools.map((tool) => {
            const isActive = activeToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-lg text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 border-l-2 border-indigo-500 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 border-l-2 border-transparent'
                }`}
              >
                <span className={`text-xs ${isActive ? 'font-semibold text-white' : 'text-neutral-300'}`}>
                  {tool.name}
                </span>
                {tool.isCryptographic && (
                  <span className="text-[10px] text-indigo-400 font-mono font-normal">
                    crypto
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 border-r border-neutral-800 bg-neutral-950 flex-col h-[calc(100vh-3.5rem)] sticky top-14">
        {renderToolList()}
      </aside>

      {/* Mobile Drawer (Slide-over) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileDrawer}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-4/5 max-w-xs h-full bg-neutral-950 border-r border-neutral-800 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <span className="text-xs font-semibold text-neutral-100 uppercase tracking-wider">
                Select Utility ({filteredTools.length})
              </span>
              <button
                onClick={onCloseMobileDrawer}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close utilities menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderToolList()}
          </div>
        </div>
      )}
    </>
  );
};
