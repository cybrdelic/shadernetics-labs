import React, { useState } from 'react';
import { BookOpen, Box, Layers, Cpu, Check, Clipboard, Terminal, Zap, FileCode, Database } from 'lucide-react';

export const DocumentationSim: React.FC = () => {
  const [activeSection, setActiveSection] = useState('quickstart');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`doc-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-full w-full bg-[#09090b] text-zinc-300 font-sans text-xs selection:bg-blue-900/40">
      {/* 1. Sidebar Nav */}
      <div className="w-56 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
           <div className="flex items-center gap-2 text-white font-bold tracking-tight">
              <div className="p-1 bg-blue-600 rounded-sm">
                 <BookOpen size={14} className="text-white" />
              </div>
              <span className="text-sm">Developer Guide</span>
           </div>
           <div className="mt-2 text-[10px] text-zinc-500 font-medium">
              Framework v2.2.0 (SimBase)
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
           <NavGroup title="GETTING STARTED">
               <NavItem label="Quick Start" id="quickstart" icon={<Zap size={12}/>} active={activeSection} onClick={scrollTo} />
           </NavGroup>
           
           <NavGroup title="CORE CONCEPTS">
               <NavItem label="SimBase Class" id="simbase" icon={<Box size={12}/>} active={activeSection} onClick={scrollTo} />
               <NavItem label="Parameters" id="params" icon={<Layers size={12}/>} active={activeSection} onClick={scrollTo} />
           </NavGroup>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 overflow-y-auto relative bg-[#09090b]">
        <div className="max-w-3xl mx-auto p-10 pb-24 space-y-16">
            
            {/* Header */}
            <div className="space-y-4 pb-8 border-b border-zinc-800">
                <h1 className="text-3xl font-bold text-white tracking-tight">SimBase Framework</h1>
                <p className="text-base text-zinc-400 leading-relaxed">
                    We've introduced <code className="text-zinc-200 font-medium">SimBase</code> to eliminate boilerplate. You no longer need to write camera math, resize observers, or input handlers manually.
                </p>
            </div>

            {/* Quick Start */}
            <section id="doc-quickstart" className="space-y-6 scroll-mt-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-900/20 text-blue-400 flex items-center justify-center border border-blue-900/40">
                        <Zap size={16} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Quick Start Template</h2>
                </div>
                
                <p className="text-zinc-400">
                    Extend <code className="text-blue-300">SimBase</code> to get free camera controls and input handling.
                </p>

                <CodeBlock 
                    filename="WebGPURenderer.ts"
                    language="typescript"
                    code={`
import { SimBase } from './SimBase';

export class WebGPURenderer extends SimBase {
  constructor(device, ctx, format) {
    super(device, ctx, format);

    // 1. Define UI (Auto-generates Inspectors)
    this.addParam({ id: 'speed', label: 'Speed', type: 'float', value: 1.0 });

    // 2. Setup Resources (Pipeline, Buffers)
    // ...
  }

  // 3. Called automatically when UI changes
  onParamUpdate(id, val) {
    this.uploadUniforms();
  }

  render() {
    // this.viewProjMat is automatically updated by SimBase
    // ... draw ...
  }
}`} 
                />
            </section>

            {/* SimBase Features */}
            <section id="doc-simbase" className="space-y-6 scroll-mt-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center border border-zinc-700">
                        <Box size={16} />
                    </div>
                    <h2 className="text-xl font-bold text-white">SimBase Features</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Card 
                        title="Auto-Camera" 
                        icon={<Database size={16}/>}
                        description="Orbit controls are built-in. Just use `this.viewProjMat` in your shader."
                    />
                    <Card 
                        title="Input Handling" 
                        icon={<Terminal size={16}/>}
                        description="Mouse drag, scroll zoom, and resize events are handled automatically."
                    />
                </div>
            </section>
        </div>
      </div>
      
       {/* 3. Right TOC (On this page) */}
      <div className="w-48 hidden xl:block p-8 sticky top-0 h-screen overflow-y-auto">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">On This Page</h4>
          <ul className="space-y-2 border-l border-zinc-800">
             <TocItem id="quickstart" label="Quick Start" active={activeSection} onClick={scrollTo} />
             <TocItem id="simbase" label="SimBase" active={activeSection} onClick={scrollTo} />
          </ul>
      </div>

    </div>
  );
};

// ... Helper components (same as before) ...
const NavGroup: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="space-y-1">
        <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{title}</h3>
        {children}
    </div>
);

const NavItem: React.FC<{label: string; id: string; icon: React.ReactNode; active: string; onClick: (id: string) => void}> = ({ label, id, icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full text-left px-3 py-1.5 rounded-md transition-all flex items-center gap-2.5 ${
            active === id 
            ? 'bg-zinc-800 text-white font-medium shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
    >
        <span className={active === id ? "text-blue-400" : "text-zinc-500"}>{icon}</span>
        {label}
    </button>
);

const TocItem: React.FC<{label: string; id: string; active: string; onClick: (id: string) => void}> = ({ label, id, active, onClick }) => (
    <li>
        <button 
            onClick={() => onClick(id)}
            className={`pl-4 text-left border-l -ml-px transition-colors ${
                active === id 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
        >
            {label}
        </button>
    </li>
);

const Card: React.FC<{title: string; icon: React.ReactNode; description: string}> = ({ title, icon, description }) => (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
        <div className="flex items-center gap-2 mb-2 text-zinc-200 font-bold">
            {icon} {title}
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
            {description}
        </p>
    </div>
);

const CodeBlock: React.FC<{code: string; language: string; filename?: string}> = ({ code, language, filename }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const highlight = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.trim().startsWith('//')) return <div key={i} className="text-zinc-500">{line}</div>;
            let l = line
                .replace(/(import|export|class|const|let|var|return|function|new|public|super)/g, '<span class="text-purple-400">$1</span>')
                .replace(/(from|implements|extends)/g, '<span class="text-purple-400">$1</span>')
                .replace(/(this)/g, '<span class="text-red-400">$1</span>')
                .replace(/('.*?')/g, '<span class="text-emerald-400">$1</span>')
                .replace(/(SimBase|GPUDevice)/g, '<span class="text-yellow-200">$1</span>')
                .replace(/(addParam|onParamUpdate|createPipeline)/g, '<span class="text-blue-400">$1</span>');
            return <div key={i} dangerouslySetInnerHTML={{__html: l}} />;
        });
    };

    return (
        <div className="rounded-lg overflow-hidden border border-zinc-800 bg-[#0c0c0e] shadow-2xl my-4 group">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-zinc-700" /><div className="w-2.5 h-2.5 rounded-full bg-zinc-700" /><div className="w-2.5 h-2.5 rounded-full bg-zinc-700" /></div>
                    {filename && <span className="ml-2 text-[10px] text-zinc-500 font-mono">{filename}</span>}
                </div>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-white transition-colors">
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-4 overflow-x-auto font-mono text-[11px] leading-relaxed">
                {highlight(code.trim())}
            </div>
        </div>
    );
};