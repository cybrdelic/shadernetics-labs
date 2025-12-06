
import React from 'react';
import { Cpu, Zap, Database, Monitor, Box, AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';

interface SystemInfoSimProps {
  adapter: GPUAdapter | null;
  adapterInfo: GPUAdapterInfo | null;
  webGLFallbackName?: string | null;
}

const KNOWN_LIMITS = [
  'maxTextureDimension1D',
  'maxTextureDimension2D',
  'maxTextureDimension3D',
  'maxTextureArrayLayers',
  'maxBindGroups',
  'maxBindGroupsPlusVertexBuffers',
  'maxBindingsPerBindGroup',
  'maxDynamicUniformBuffersPerPipelineLayout',
  'maxDynamicStorageBuffersPerPipelineLayout',
  'maxSampledTexturesPerShaderStage',
  'maxSamplersPerShaderStage',
  'maxStorageBuffersPerShaderStage',
  'maxStorageTexturesPerShaderStage',
  'maxUniformBuffersPerShaderStage',
  'maxUniformBufferBindingSize',
  'maxStorageBufferBindingSize',
  'minUniformBufferOffsetAlignment',
  'minStorageBufferOffsetAlignment',
  'maxVertexBuffers',
  'maxBufferSize',
  'maxVertexAttributes',
  'maxVertexBufferArrayStride',
  'maxInterStageShaderComponents',
  'maxInterStageShaderVariables',
  'maxColorAttachments',
  'maxColorAttachmentBytesPerSample',
  'maxComputeWorkgroupStorageSize',
  'maxComputeInvocationsPerWorkgroup',
  'maxComputeWorkgroupSizeX',
  'maxComputeWorkgroupSizeY',
  'maxComputeWorkgroupSizeZ',
  'maxComputeWorkgroupsPerDimension',
];

export const SystemInfoSim: React.FC<SystemInfoSimProps> = ({ adapter, adapterInfo, webGLFallbackName }) => {
  if (!adapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 bg-zinc-900 p-8">
        <AlertTriangle size={32} className="text-amber-500" />
        <span className="text-sm font-medium text-zinc-300">No GPU Adapter Detected</span>
        <p className="text-xs text-center max-w-[200px]">
          WebGPU may not be supported or enabled in this browser.
        </p>
      </div>
    );
  }

  // Robust Display Name Resolution
  // 1. Prefer explicit WebGPU Info
  let displayName = adapterInfo?.device || adapterInfo?.description || adapter.name || "Generic WebGPU Adapter";
  let isFallback = false;

  // 2. If WebGPU info is generic, check WebGL fallback
  // Handle case where displayName is explicitly "undefined" string from raw logs
  if ((displayName.toLowerCase().includes('generic') || displayName === "undefined") && webGLFallbackName) {
      displayName = webGLFallbackName;
      isFallback = true;
  }

  const vendor = adapterInfo?.vendor || "Vendor Unknown";
  const architecture = adapterInfo?.architecture || "Arch Unknown";

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 text-xs text-zinc-300 font-sans">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/20 rounded-md border border-blue-800/50 text-blue-400">
                <Cpu size={20} />
            </div>
            <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-white tracking-wide truncate" title={displayName}>
                    {displayName}
                </h2>
                <div className="flex gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span className="uppercase">{vendor !== 'N/A' ? vendor : 'Unknown Vendor'}</span>
                    <span>•</span>
                    <span className="uppercase">{architecture !== 'N/A' ? architecture : 'Unknown Arch'}</span>
                    <span className="text-emerald-500 font-bold ml-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                      WEBGPU ACTIVE
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
        
        {/* Core Info */}
        <section>
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Monitor size={12} /> Hardware ID
             </h3>
             <div className="bg-zinc-800/30 rounded-sm border border-zinc-800 overflow-hidden">
                 <div className="grid grid-cols-[100px_1fr] border-b border-zinc-800/50 last:border-0">
                     <div className="px-3 py-2 bg-zinc-800/50 text-zinc-500 font-medium">Name</div>
                     <div className="px-3 py-2 text-zinc-300 font-mono text-[10px]">{adapter.name || 'N/A'}</div>
                 </div>
                 <div className="grid grid-cols-[100px_1fr] border-b border-zinc-800/50 last:border-0">
                     <div className="px-3 py-2 bg-zinc-800/50 text-zinc-500 font-medium">Driver</div>
                     <div className="px-3 py-2 text-zinc-300 font-mono text-[10px]">{adapterInfo?.description || 'N/A'}</div>
                 </div>
                 <div className="grid grid-cols-[100px_1fr] border-b border-zinc-800/50 last:border-0">
                     <div className="px-3 py-2 bg-zinc-800/50 text-zinc-500 font-medium">Vendor</div>
                     <div className="px-3 py-2 text-zinc-300 font-mono text-[10px]">{adapterInfo?.vendor || 'N/A'}</div>
                 </div>
                 <div className="grid grid-cols-[100px_1fr] border-b border-zinc-800/50 last:border-0">
                     <div className="px-3 py-2 bg-zinc-800/50 text-zinc-500 font-medium">Arch</div>
                     <div className="px-3 py-2 text-zinc-300 font-mono text-[10px]">{adapterInfo?.architecture || 'N/A'}</div>
                 </div>
                 <div className="grid grid-cols-[100px_1fr] border-b border-zinc-800/50 last:border-0">
                     <div className="px-3 py-2 bg-zinc-800/50 text-zinc-500 font-medium">Source</div>
                     <div className="px-3 py-2 text-zinc-300 font-mono text-[10px]">
                        {isFallback ? (
                            <span className="text-blue-400">Unmasked via WebGL_debug_renderer_info</span>
                        ) : (
                            <span className="text-emerald-400">Native WebGPU Adapter Info</span>
                        )}
                     </div>
                 </div>
             </div>
        </section>

        {/* Features */}
        <section>
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap size={12} /> Enabled Features
             </h3>
             <div className="flex flex-wrap gap-2">
                 {Array.from(adapter.features).length > 0 ? Array.from(adapter.features).map(feature => (
                     <div key={feature} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/10 border border-emerald-900/30 rounded-full text-emerald-400 font-medium text-[10px]">
                         <CheckCircle2 size={10} />
                         {feature}
                     </div>
                 )) : (
                     <div className="text-zinc-600 italic px-2">No optional features enabled.</div>
                 )}
             </div>
        </section>

        {/* Limits */}
        <section>
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Database size={12} /> Hardware Limits
             </h3>
             <div className="grid grid-cols-1 gap-px bg-zinc-800 border border-zinc-800 rounded-sm overflow-hidden">
                 {KNOWN_LIMITS.map((limitKey) => {
                     // @ts-ignore
                     const val = adapter.limits[limitKey];
                     return (
                         <div key={limitKey} className="grid grid-cols-[1fr_100px] bg-zinc-900 hover:bg-zinc-800/80 transition-colors">
                             <div className="px-3 py-1.5 text-zinc-400 border-r border-zinc-800 truncate" title={limitKey}>
                                 {limitKey}
                             </div>
                             <div className="px-3 py-1.5 text-right font-mono text-zinc-300">
                                 {val !== undefined ? val.toLocaleString() : '-'}
                             </div>
                         </div>
                     );
                 })}
             </div>
        </section>

        {/* Raw Debug Info */}
        <section>
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileJson size={12} /> Raw Debug
             </h3>
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                <div className="mb-2">
                    <span className="text-blue-400">adapter.name:</span> {adapter.name ? JSON.stringify(adapter.name) : <span className="text-zinc-600 italic">(Hidden by Browser)</span>}
                </div>
                <div>
                    <span className="text-blue-400">adapterInfo:</span>
                    <pre className="mt-1 text-zinc-500">{JSON.stringify(adapterInfo, null, 2)}</pre>
                </div>
                {webGLFallbackName && (
                  <div className="mt-2">
                    <span className="text-blue-500">WebGL Fallback String:</span> {JSON.stringify(webGLFallbackName)}
                  </div>
                )}
             </div>
        </section>
      </div>
    </div>
  );
};
