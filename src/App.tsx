import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ToolSidebar, ALL_TOOLS } from './components/ToolSidebar';
import { EncodingWorkspace } from './components/EncodingWorkspace';
import { HashWorkspace } from './components/HashWorkspace';
import { FileHashLab } from './components/FileHashLab';
import { JwtWorkspace } from './components/JwtWorkspace';
import { QueryStringWorkspace } from './components/QueryStringWorkspace';
import { UnicodeInspector } from './components/UnicodeInspector';
import { DetectionWorkspace } from './components/DetectionWorkspace';
import { ToolId, ToolCategory } from './types';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export default function App() {
  const [activeToolId, setActiveToolId] = useState<ToolId>('base64');
  const [currentCategory, setCurrentCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const activeTool = ALL_TOOLS.find((t) => t.id === activeToolId) || ALL_TOOLS[0];

  const handleSelectCategory = (cat: ToolCategory) => {
    setCurrentCategory(cat);
    setSearchQuery('');
    if (cat !== 'all') {
      const firstInCat = ALL_TOOLS.find((t) => t.category === cat);
      if (firstInCat && activeTool.category !== cat) {
        setActiveToolId(firstInCat.id);
      }
    }
  };

  const renderActiveWorkspace = () => {
    switch (activeToolId) {
      case 'detector':
        return <DetectionWorkspace onSelectTool={setActiveToolId} />;
      case 'hash-generator':
        return <HashWorkspace initialMode="digest" />;
      case 'file-hasher':
        return <FileHashLab />;
      case 'jwt-inspector':
        return <JwtWorkspace />;
      case 'query-string':
        return <QueryStringWorkspace />;
      case 'unicode':
        return <UnicodeInspector initialType="unicode" />;
      default:
        return <EncodingWorkspace tool={activeTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* Top Bar Navigation */}
      <Navbar
        currentCategory={currentCategory}
        onSelectCategory={handleSelectCategory}
        onToggleMobileMenu={() => setIsMobileDrawerOpen((prev) => !prev)}
      />

      {/* Mobile Active Tool Bar */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-neutral-900/90 border-b border-neutral-800/80 sticky top-14 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">
            Active:
          </span>
          <span className="text-xs font-semibold text-neutral-100 truncate">
            {activeTool.name}
          </span>
        </div>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 rounded-md shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>All Utilities</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto min-h-0">
        {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
        <ToolSidebar
          activeToolId={activeToolId}
          onSelectTool={(id) => setActiveToolId(id)}
          currentCategory={currentCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {/* Workspace Canvas */}
        <main className="flex-1 flex flex-col min-w-0">
          {renderActiveWorkspace()}
        </main>
      </div>
    </div>
  );
}
