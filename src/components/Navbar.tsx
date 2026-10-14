import React from 'react';
import { Logo } from './Logo';
import { ToolCategory } from '../types';
import { Menu } from 'lucide-react';

interface NavbarProps {
  currentCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCategory,
  onSelectCategory,
  onToggleMobileMenu,
}) => {
  const categories: {
    id: ToolCategory;
    label: string;
    activeClass: string;
    hoverClass: string;
  }[] = [
    {
      id: 'all',
      label: 'All Tools',
      activeClass: 'text-indigo-200 bg-indigo-950/60 border-indigo-500/50 shadow-xs shadow-indigo-500/20',
      hoverClass: 'hover:text-indigo-200 hover:bg-neutral-900/80',
    },
    {
      id: 'detection',
      label: 'Detector',
      activeClass: 'text-rose-200 bg-rose-950/60 border-rose-500/50 shadow-xs shadow-rose-500/20',
      hoverClass: 'hover:text-rose-200 hover:bg-neutral-900/80',
    },
    {
      id: 'reversible',
      label: 'Encodings',
      activeClass: 'text-sky-200 bg-sky-950/60 border-sky-500/50 shadow-xs shadow-sky-500/20',
      hoverClass: 'hover:text-sky-200 hover:bg-neutral-900/80',
    },
    {
      id: 'tokens-data',
      label: 'Tokens & Data',
      activeClass: 'text-amber-200 bg-amber-950/60 border-amber-500/50 shadow-xs shadow-amber-500/20',
      hoverClass: 'hover:text-amber-200 hover:bg-neutral-900/80',
    },
    {
      id: 'ciphers',
      label: 'Ciphers',
      activeClass: 'text-emerald-200 bg-emerald-950/60 border-emerald-500/50 shadow-xs shadow-emerald-500/20',
      hoverClass: 'hover:text-emerald-200 hover:bg-neutral-900/80',
    },
    {
      id: 'hashes',
      label: 'Hashes',
      activeClass: 'text-purple-200 bg-purple-950/60 border-purple-500/50 shadow-xs shadow-purple-500/20',
      hoverClass: 'hover:text-purple-200 hover:bg-neutral-900/80',
    },
    {
      id: 'file-checksum',
      label: 'File Checksum',
      activeClass: 'text-cyan-200 bg-cyan-950/60 border-cyan-500/50 shadow-xs shadow-cyan-500/20',
      hoverClass: 'hover:text-cyan-200 hover:bg-neutral-900/80',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xl transition-all shadow-md shadow-black/40">
      {/* Top multi-tone chromatic hairline highlight */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/60 via-sky-400/50 to-transparent" />

      <div className="flex items-center justify-between h-14 px-3 sm:px-6 max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Left: Mobile Menu Button + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle utilities sidebar"
              title="Toggle utilities sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo & Brand Title */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onSelectCategory('all'); }}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 blur-xs opacity-60 group-hover:opacity-100 transition duration-300" />
              <div className="relative flex items-center justify-center">
                <Logo size={26} className="transition-transform group-hover:scale-105 duration-200" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                <span className="sm:hidden">Crypto Lab</span>
                <span className="hidden sm:inline">Encoding &amp; Hash Lab</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight -mt-0.5 hidden lg:inline">
                Web Crypto Utility
              </span>
            </div>
          </a>
        </div>

        {/* Center: Navigation Categories (touch-scrollable) */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg border transition-all duration-150 flex items-center whitespace-nowrap cursor-pointer ${
                  isActive
                    ? `${cat.activeClass}`
                    : `text-neutral-400 ${cat.hoverClass} border-transparent bg-transparent`
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
