import React, { useState } from 'react';
import { BoldButton } from '../ui/Core';
import { Box, Layers, Zap, Database, Image as ImageIcon, Cpu, AlertTriangle } from 'lucide-react';
import { GPUResourceRecord } from '../../types';

const TABS = ['ADAPTER', 'BUFFERS', 'TEXTURES', 'SHADERS'];

interface WebGPUDebugSimProps {
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  resources: GPUResourceRecord[];
}

export const WebGPUDebugSim: React.FC<WebGPUDebugSimProps> = ({ adapter, device, resources }) => {
  const [activeTab, setActiveTab] = useState('ADAPTER');

  if (!adapter) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 bg-zinc-900">
          <AlertTriangle size={24} />
          <span className="text-xs font-medium">WebGPU Not Available</span>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 text-xs text-zinc-300">
      {/* Tab Navigation */}
      <div className="flex items-center px-2 py-2 border-b border-zinc-800 bg-zinc-800/30 gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-sm text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === tab 
                ? 'bg-blue-700 text-white shadow-sm' 
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-900 font-mono">
        {activeTab === 'ADAPTER' && <AdapterInfo adapter={adapter} />}
        {activeTab === 'BUFFERS' && <BufferList resources={resources} />}
        {activeTab === 'TEXTURES' && <TextureList resources={resources} />}
        {activeTab === 'SHADERS' && <ShaderInspector resources={resources} />}
      </div>
      
      {/* Footer Status */}
      <div className="border-t border-zinc-800 bg-zinc-900 px-3 py-1.5 flex justify-between text-[10px] text-zinc-500">
          <span className="uppercase">{adapter.name || "Unknown Adapter"}</span>
          <span>REALTIME</span>
      </div>
    </div>
  );
};

const AdapterInfo: React.FC<{ adapter: GPUAdapter }> = ({ adapter }) => {
  // Manual list of common limits to display since we can't iterate easily over all in some browsers
  const limitsToShow = [
    'maxTextureDimension2D',
    'maxBufferBindingSize',
    'maxBindGroups',
    'maxUniformBufferBindingSize',
    'minUniformBufferOffsetAlignment',
    'maxVertexAttributes',
    'maxComputeWorkgroupSizeX',
    'maxComputeInvocationsPerWorkgroup'
  ];

  return (
    <div className="space-y-4">
      <Section title="Device Limits">
         {limitsToShow.map(key => (
            // @ts-ignore - Indexing limits
            <LimitRow key={key} label={key} value={adapter.limits[key]?.toString() || 'N/A'} />
         ))}
      </Section>
      
      <Section title="Features Enabled">
          <div className="flex flex-wrap gap-2 mt-2">
              {Array.from(adapter.features).map(f => (
                  <span key={f} className="px-2 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded-sm text-[10px] font-medium">
                      {f}
                  </span>
              ))}
              {adapter.features.size === 0 && <span className="text-zinc-600 italic">No optional features enabled</span>}
          </div>
      </Section>
    </div>
  );
};

const BufferList: React.FC<{ resources: GPUResourceRecord[] }> = ({ resources }) => {
    const buffers = resources.filter(r => r.type === 'Buffer');
    return (
    <div className="space-y-2">
         <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-500 pb-2 border-b border-zinc-800">
             <span>LABEL</span>
             <span>SIZE (B)</span>
             <span>USAGE</span>
             <span>ID</span>
         </div>
         {buffers.length === 0 ? (
             <div className="text-zinc-600 italic py-4 text-center">No buffers allocated</div>
         ) : (
            buffers.map(b => (
                <BufferRow 
                    key={b.id} 
                    label={b.label} 
                    size={Number(b.details.size)} 
                    usage={String(b.details.usage)} 
                />
            ))
         )}
    </div>
)};

const TextureList: React.FC<{ resources: GPUResourceRecord[] }> = ({ resources }) => {
    const textures = resources.filter(r => r.type === 'Texture');
    return (
     <div className="grid grid-cols-3 gap-4">
        {textures.length === 0 ? (
            <div className="col-span-3 text-zinc-600 italic py-4 text-center">No textures allocated</div>
        ) : (
            textures.map(t => (
                <TexturePreview 
                    key={t.id} 
                    name={t.label} 
                    format={String(t.details.format)} 
                    dim={String(t.details.size)} 
                />
            ))
        )}
     </div>
)};

const ShaderInspector: React.FC<{ resources: GPUResourceRecord[] }> = ({ resources }) => {
    const shaders = resources.filter(r => r.type === 'ShaderModule');
    return (
    <div className="space-y-4">
        {shaders.length === 0 ? (
            <div className="text-zinc-600 italic py-4 text-center">No shader modules loaded</div>
        ) : (
            shaders.map(s => (
                <div key={s.id} className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-sm">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-blue-400">{s.label}</span>
                        <span className="text-zinc-500">WGSL</span>
                    </div>
                    <div className="text-[9px] text-zinc-400 truncate font-mono bg-zinc-900 p-2 border border-zinc-800">
                        {/* We can't easily extract source back from the object, so we show metadata */}
                        Module ID: {s.id}
                    </div>
                </div>
            ))
        )}
    </div>
)};

// Helpers
const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="pb-2">
        <h4 className="text-zinc-200 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Zap size={12} className="text-zinc-500" />
            {title}
        </h4>
        {children}
    </div>
);

const LimitRow: React.FC<{label: string; value: string}> = ({ label, value }) => (
    <div className="flex justify-between py-1 border-b border-zinc-800 hover:bg-zinc-800/50">
        <span className="text-zinc-500 font-medium">{label}</span>
        <span className="text-zinc-300 font-mono">{value}</span>
    </div>
);

const BufferRow: React.FC<{label: string; size: number; usage: string}> = ({ label, size, usage }) => (
     <div className="grid grid-cols-4 gap-2 py-1.5 border-b border-zinc-800 items-center hover:bg-blue-900/10 cursor-pointer">
         <span className="font-medium text-blue-400 flex items-center gap-2">
            <Database size={10} className="text-zinc-600" /> {label}
         </span>
         <span className="text-zinc-400">{size.toLocaleString()}</span>
         <span className="text-[9px] text-zinc-600 truncate">{usage}</span>
         <span className="flex items-center gap-1 text-emerald-500 font-bold text-[9px]">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE
         </span>
     </div>
);

const TexturePreview: React.FC<{name: string; format: string; dim: string}> = ({ name, format, dim }) => (
    <div className="border border-zinc-700 rounded-sm bg-zinc-800 p-2 hover:border-blue-500 transition-colors cursor-pointer group">
        <div className="w-full aspect-square bg-zinc-900 mb-2 rounded-sm overflow-hidden relative border border-zinc-800">
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <ImageIcon size={24} />
            </div>
             {/* Checkerboard */}
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
        </div>
        <div className="text-[10px]">
            <div className="font-bold text-zinc-300 truncate">{name}</div>
            <div className="flex justify-between text-zinc-500 mt-1">
                <span>{format}</span>
                <span className="truncate ml-1">{dim}</span>
            </div>
        </div>
    </div>
);