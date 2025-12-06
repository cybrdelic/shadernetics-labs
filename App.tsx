import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MenuBar } from './components/layout/MenuBar';
import { DataSim } from './components/sims/DataSim';
import { ReasoningSim } from './components/sims/ReasoningSim';
import { SystemLogSim } from './components/sims/SystemLogSim';
import { WebGPUDebugSim } from './components/sims/WebGPUDebugSim';
import { SimulationCanvas } from './components/sims/SimulationCanvas';
import { ParamControlsSim } from './components/sims/ParamControlsSim';
import { SystemInfoSim } from './components/sims/SystemInfoSim';
import { DocumentationSim } from './components/sims/DocumentationSim';
import { MenuItem, ToolType, WindowState, LogEntry, GPUResourceRecord, SimParam } from './types';
import { DraggableWindow } from './components/ui/Core';
import { Activity, Terminal, Sliders, Box, MonitorDot, BookOpen } from 'lucide-react';
import { WebGPURenderer } from './components/framework/WebGPURenderer';

export default function App() {
  const [windows, setWindows] = useState<WindowState[]>([
    { id: 'data-1', type: ToolType.DATA, title: 'Telemetry', isOpen: false, position: { x: 50, y: 100 }, size: { w: 400, h: 300 }, zIndex: 1 },
    { id: 'controls-1', type: ToolType.CONTROLS, title: 'Inspector', isOpen: true, position: { x: 50, y: 100 }, size: { w: 300, h: 400 }, zIndex: 2 },
    { id: 'ai-1', type: ToolType.AI, title: 'Reasoning', isOpen: false, position: { x: 500, y: 100 }, size: { w: 350, h: 450 }, zIndex: 3 },
    { id: 'logs-1', type: ToolType.LOGS, title: 'System Logs', isOpen: true, position: { x: 50, y: 550 }, size: { w: 600, h: 250 }, zIndex: 4 },
    { id: 'gpu-1', type: ToolType.WEBGPU_DEBUG, title: 'GPU Debug', isOpen: false, position: { x: 700, y: 450 }, size: { w: 500, h: 400 }, zIndex: 5 },
    { id: 'sys-1', type: ToolType.SYSTEM_INFO, title: 'System Info', isOpen: false, position: { x: 300, y: 150 }, size: { w: 450, h: 600 }, zIndex: 6 },
    { id: 'docs-1', type: ToolType.DOCS, title: 'Documentation', isOpen: false, position: { x: 150, y: 80 }, size: { w: 800, h: 600 }, zIndex: 7 },
  ]);

  // -- Real WebGPU State --
  const [adapter, setAdapter] = useState<GPUAdapter | null>(null);
  const [adapterInfo, setAdapterInfo] = useState<GPUAdapterInfo | null>(null);
  const [webGLFallbackName, setWebGLFallbackName] = useState<string | null>(null);
  const [device, setDevice] = useState<GPUDevice | null>(null);
  const [resources, setResources] = useState<GPUResourceRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gpuError, setGpuError] = useState<string | null>(null);
  
  // -- Sim State --
  // Initialize as empty, wait for renderer to populate
  const [simParams, setSimParams] = useState<SimParam[]>([]);
  const rendererRef = useRef<WebGPURenderer | null>(null);

  const addLog = useCallback((level: 'INFO' | 'WARN' | 'ERR' | 'OK', category: string, msg: string) => {
    setLogs(prev => {
        const newLog = {
            id: Date.now() + Math.random(),
            ts: new Date().toISOString().split('T')[1].slice(0, -1),
            level,
            category,
            msg
        };
        // Keep max 200 logs to prevent DOM memory leaks
        return [...prev, newLog].slice(-200);
    });
  }, []);
  
  const clearLogs = useCallback(() => {
      setLogs([]);
      addLog('INFO', 'SYSTEM', 'Logs cleared manually.');
  }, [addLog]);

  const trackResource = useCallback((type: GPUResourceRecord['type'], label: string, details: any) => {
    setResources(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: label || 'Unnamed',
      details
    }]);
  }, []);

  const handleCopyDebug = useCallback(async () => {
    const report = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        adapter: adapter ? {
            name: adapter.name,
            info: adapterInfo,
            webGLFallback: webGLFallbackName,
            limits: adapter.limits,
            features: Array.from(adapter.features)
        } : 'NO_ADAPTER',
        parameters: simParams,
        resources: resources.map(r => ({
            type: r.type,
            label: r.label,
            details: r.details 
        })),
        recentLogs: logs
    };

    try {
        await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        addLog('OK', 'SYSTEM', 'Full debug context copied to clipboard.');
    } catch (e) {
        addLog('ERR', 'SYSTEM', 'Failed to copy to clipboard.');
    }
  }, [adapter, adapterInfo, webGLFallbackName, simParams, resources, logs, addLog]);

  // Helper to parse complex ANGLE strings into clean names
  const cleanRendererString = (renderer: string) => {
      // Example: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028A0) Direct3D11 vs_5_0 ps_5_0, D3D11)"
      // Target: "NVIDIA GeForce RTX 4060 Laptop GPU"
      
      let name = renderer;
      
      // 1. Handle ANGLE wrapper
      const angleMatch = name.match(/ANGLE \((.*)\)/);
      if (angleMatch) {
          const parts = angleMatch[1].split(',').map(s => s.trim());
          // The second part is usually the renderer name in ANGLE strings
          if (parts.length > 1) {
              name = parts[1];
          } else {
              name = parts[0];
          }
      }

      // 2. Remove technical noise (Hex IDs, APIs)
      name = name
          .replace(/\s*\(0x[0-9A-Fa-f]+\).*/, '') // Remove (0x1234)...
          .replace(/\s*Direct3D.*/i, '')          // Remove Direct3D...
          .replace(/\s*OpenGL.*/i, '')            // Remove OpenGL...
          .replace(/\s*vs_.*$/, '')               // Remove shader versions
          .trim();
          
      return name;
  };

  // Helper to hackily get the GPU name via WebGL if WebGPU is being shy
  const getWebGLRenderer = () => {
      try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) return null;
          // @ts-ignore
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (!debugInfo) return null;
          // @ts-ignore
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer as string;
      } catch (e) {
          return null;
      }
  };

  useEffect(() => {
    const initWebGPU = async () => {
      addLog('INFO', 'INIT', 'Initializing WebGPU Context...');

      if (!navigator.gpu) {
        setGpuError("WebGPU not supported/enabled in this browser.");
        addLog('ERR', 'INIT', 'navigator.gpu is undefined. Check flags.');
        return;
      }

      addLog('INFO', 'INIT', 'navigator.gpu is available. Requesting Adapter...');
      try {
        // Request adapter with fallback preference to ensure we get *something*
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance'
        });
        
        if (!adapter) {
          setGpuError("No WebGPU adapter found.");
          addLog('ERR', 'INIT', 'requestAdapter returned null.');
          return;
        }

        // --- RAW DEBUG DUMP ---
        const nameType = typeof adapter.name;
        if (nameType === 'undefined' || !adapter.name) {
             addLog('INFO', 'PRIVACY', `adapter.name is hidden by browser privacy settings.`);
        } else {
             addLog('INFO', 'DEBUG', `Raw adapter.name: "${adapter.name}"`);
        }

        const adapterDump = {
            name: adapter.name || "(Hidden by Browser)",
            isFallback: (adapter as any).isFallbackAdapter,
            features: Array.from(adapter.features),
            limits: "See System Info",
        };
        addLog('INFO', 'RAW_CONN', `Adapter Acquired.`);
        // ----------------------

        setAdapter(adapter);
        
        // Fetch detailed info if available
        let info: GPUAdapterInfo | null = null;
        
        const isInfoValid = (i: any) => {
            if (!i) return false;
            // Check if it has at least one useful string property that isn't empty
            const hasData = (i.device && i.device.length > 0) || 
                            (i.description && i.description.length > 0) || 
                            (i.vendor && i.vendor.length > 0);
            return hasData;
        };

        try {
            // 1. Check synchronous property
            if (adapter.info && isInfoValid(adapter.info)) {
                 info = adapter.info;
                 addLog('OK', 'INFO_PROP', `Found valid .info: ${JSON.stringify(info)}`);
            } 
            // 2. If property is empty or missing, try async
            else {
                if (adapter.info) {
                    addLog('WARN', 'INFO_PROP', `.info property empty. Attempting async fetch...`);
                }

                if (adapter.requestAdapterInfo) {
                    addLog('INFO', 'REQ_INFO', 'Calling requestAdapterInfo()...');
                    // @ts-ignore
                    const asyncInfo = await adapter.requestAdapterInfo();
                    addLog('OK', 'REQ_INFO', `Async Result: ${JSON.stringify(asyncInfo)}`);
                    if (isInfoValid(asyncInfo)) {
                        info = asyncInfo;
                    } else if (!info && asyncInfo) {
                        // Use it even if it looks empty if we have nothing else
                        info = asyncInfo;
                    }
                } else {
                    addLog('WARN', 'INIT', 'requestAdapterInfo API not available.');
                }
            }
        } catch (e) {
            addLog('WARN', 'ADAPTER', `Info fetch warning: ${String(e)}`);
        }

        if (info) {
            setAdapterInfo(info);
        } else {
            // Synthetic Info
            const fallbackInfo = {
                vendor: 'Unknown',
                architecture: 'Unknown',
                device: adapter.name || 'Generic WebGPU Adapter',
                description: adapter.name || 'Generic WebGPU Adapter'
            };
            setAdapterInfo(fallbackInfo);
            addLog('WARN', 'ADAPTER', 'Using synthetic adapter info (Browser blocked details).');
        }

        // Check for WebGL Fallback if name is still generic
        const currentName = info?.device || info?.description || adapter.name || "";
        if (!currentName || currentName.toLowerCase().includes("generic") || currentName === "undefined") {
            addLog('INFO', 'INIT', 'WebGPU name masked. Running WebGL Cross-Check...');
            const glName = getWebGLRenderer();
            if (glName) {
                const cleanName = cleanRendererString(glName);
                setWebGLFallbackName(cleanName);
                addLog('OK', 'INIT', `WebGL Cross-Check Success: ${cleanName}`);
            } else {
                addLog('WARN', 'INIT', 'WebGL Cross-Check failed to unmask renderer.');
            }
        }

        addLog('INFO', 'INIT', 'Requesting Device...');
        const device = await adapter.requestDevice();
        
        // Instrumentation
        const originalCreateBuffer = device.createBuffer.bind(device);
        device.createBuffer = (desc) => {
          const buffer = originalCreateBuffer(desc);
          trackResource('Buffer', desc.label || '', { size: desc.size, usage: desc.usage });
          return buffer;
        };

        const originalCreateTexture = device.createTexture.bind(device);
        device.createTexture = (desc) => {
            const tex = originalCreateTexture(desc);
            if (desc.usage !== GPUTextureUsage.RENDER_ATTACHMENT) {
                trackResource('Texture', desc.label || '', { 
                    size: JSON.stringify(desc.size), 
                    format: desc.format 
                });
            }
            return tex;
        }

        const originalCreateShaderModule = device.createShaderModule.bind(device);
        device.createShaderModule = (desc) => {
            const shader = originalCreateShaderModule(desc);
            trackResource('ShaderModule', desc.label || '', { code: desc.code });
            return shader;
        }

        device.addEventListener('uncapturederror', (event) => {
           // @ts-ignore
           addLog('ERR', 'WGPU-VAL', (event as GPUUncapturedErrorEvent).error.message);
        });

        setDevice(device);
        addLog('OK', 'DEVICE', 'Device acquired. Sim Loop Starting.');
      } catch (e) {
        setGpuError("WebGPU Init Failed: " + String(e));
        addLog('ERR', 'INIT', String(e));
      }
    };

    initWebGPU();
  }, []); 

  // -- Dynamic Param Handling --

  const handleRendererInit = useCallback((renderer: WebGPURenderer) => {
      rendererRef.current = renderer;
      // Extract schema from renderer to build UI
      const schema = renderer.getSchema();
      setSimParams(schema);
      addLog('OK', 'FRAMEWORK', `Loaded ${schema.length} control parameters from Renderer.`);
  }, [addLog]);

  const updateParam = useCallback((id: string, val: any) => {
      // 1. Update UI state
      setSimParams(prev => prev.map(p => p.id === id ? { ...p, value: val } : p));
      
      // 2. Update Renderer (which updates GPU buffer)
      if (rendererRef.current) {
          rendererRef.current.setParam(id, val);
      }
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex));
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  }, []);

  const toggleWindow = useCallback((id: string, isOpen?: boolean) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const nextState = isOpen !== undefined ? isOpen : !w.isOpen;
        if (nextState) {
             const maxZ = Math.max(...prev.map(w => w.zIndex));
             return { ...w, isOpen: nextState, zIndex: maxZ + 1 };
        }
        return { ...w, isOpen: nextState };
      }
      return w;
    }));
  }, []);

  const menus: MenuItem[] = [
    {
      label: 'File',
      items: [
        { label: 'New Scene', action: () => window.location.reload() },
        { label: 'Import Assets...', shortcut: '⌘O' },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Inspector', action: () => toggleWindow('controls-1', true), shortcut: '⌘I' },
        { label: 'Telemetry', action: () => toggleWindow('data-1', true), shortcut: '⌘T' },
        { label: 'Logs', action: () => toggleWindow('logs-1', true), shortcut: '⌘L' },
        { label: 'GPU Debug', action: () => toggleWindow('gpu-1', true), shortcut: '⌘D' },
      ]
    },
    {
      label: 'System',
      items: [
        { label: 'Adapter Specs', action: () => toggleWindow('sys-1', true), shortcut: '⌘S' },
      ]
    },
    {
      label: 'Help',
      items: [
         { label: 'Documentation', action: () => toggleWindow('docs-1', true), shortcut: 'F1' }
      ]
    }
  ];

  const getAdapterName = () => {
    if (!adapter) return "NO ADAPTER DETECTED";
    
    // Priority: WebGL Fallback (most specific) -> Device Name -> Description -> Adapter Name
    
    // Check if we have a better name from WebGL cross-check
    if (webGLFallbackName) return webGLFallbackName;

    const infoName = adapterInfo?.device || adapterInfo?.description;
    if (infoName && !infoName.toLowerCase().includes('generic') && infoName !== "undefined") return infoName;
    
    if (adapter.name && !adapter.name.toLowerCase().includes('generic') && adapter.name !== "undefined") return adapter.name;

    // If we are here, everything is generic, but maybe WebGL failed too.
    return infoName || adapter.name || "GENERIC GPU";
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] overflow-hidden font-sans">
      <MenuBar menus={menus} appTitle="PROTOS.SIM // FRAMEWORK" />

      {/* Main Layout Layering */}
      <div className="flex-1 relative overflow-hidden bg-[#09090b]">
        
        {/* Layer 0: The Simulation Canvas (Background) */}
        <div className="absolute inset-0 z-0">
             <SimulationCanvas 
                device={device} 
                active={true} 
                onRendererInit={handleRendererInit} 
             />
        </div>

        {/* Layer 1: Floating Windows */}
        {windows.map(win => (
          <DraggableWindow
            key={win.id}
            title={win.title}
            isOpen={win.isOpen}
            onClose={() => toggleWindow(win.id, false)}
            initialPosition={win.position}
            zIndex={win.zIndex}
            onFocus={() => bringToFront(win.id)}
            className={
               win.type === ToolType.DATA ? "w-[400px] h-[300px]" :
               win.type === ToolType.AI ? "w-[350px] h-[500px]" :
               win.type === ToolType.LOGS ? "w-[600px] h-[250px]" :
               win.type === ToolType.CONTROLS ? "w-[300px] h-[400px]" :
               win.type === ToolType.SYSTEM_INFO ? "w-[450px] h-[600px]" :
               win.type === ToolType.DOCS ? "w-[800px] h-[600px]" :
               "w-[500px] h-[400px]"
            }
          >
            {win.type === ToolType.DATA && <DataSim />}
            {win.type === ToolType.AI && <ReasoningSim />}
            {win.type === ToolType.LOGS && (
                <SystemLogSim 
                    logs={logs} 
                    isPaused={false} 
                    onClear={clearLogs}
                    onCopyDebug={handleCopyDebug}
                />
            )}
            {win.type === ToolType.CONTROLS && <ParamControlsSim params={simParams} onParamChange={updateParam} />}
            {win.type === ToolType.WEBGPU_DEBUG && (
                <WebGPUDebugSim adapter={adapter} device={device} resources={resources} />
            )}
            {win.type === ToolType.SYSTEM_INFO && (
                <SystemInfoSim 
                    adapter={adapter} 
                    adapterInfo={adapterInfo} 
                    webGLFallbackName={webGLFallbackName}
                />
            )}
            {win.type === ToolType.DOCS && (
                <DocumentationSim />
            )}
          </DraggableWindow>
        ))}

        {/* Corner Dock */}
        <div className="absolute bottom-10 right-6 flex flex-col gap-3 p-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-lg shadow-2xl z-50">
          <button onClick={() => toggleWindow('controls-1')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="Inspector">
            <Sliders size={20} />
          </button>
          <button onClick={() => toggleWindow('data-1')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="Telemetry">
            <Activity size={20} />
          </button>
          <button onClick={() => toggleWindow('logs-1')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="Logs">
            <Terminal size={20} />
          </button>
          <button onClick={() => toggleWindow('gpu-1')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="GPU Debug">
            <Box size={20} />
          </button>
          <button onClick={() => toggleWindow('sys-1')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" title="System Info">
            <MonitorDot size={20} />
          </button>
          <div className="w-full h-px bg-zinc-700 my-1" />
          <button onClick={() => toggleWindow('docs-1')} className="p-3 text-blue-400 hover:text-white hover:bg-blue-900/50 rounded-md transition-colors" title="Documentation">
            <BookOpen size={20} />
          </button>
        </div>
      </div>
      
      {/* Enhanced Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#09090b] border-t border-zinc-800 flex items-center px-4 text-[10px] font-mono text-zinc-500 z-[100] justify-between shadow-lg">
          <div className="flex items-center gap-6">
              <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800/50 px-2 py-0.5 rounded transition-colors group"
                  onClick={() => toggleWindow('sys-1', true)}
                  title="Click to view Adapter Specs"
              >
                  <div className={`w-2 h-2 rounded-full ${adapter ? 'bg-blue-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-zinc-500 font-bold uppercase tracking-wider group-hover:text-zinc-400">ADAPTER:</span>
                  <span className="text-white font-bold uppercase tracking-wider">
                      {getAdapterName()}
                  </span>
              </div>

              <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                  <div className={`w-2 h-2 rounded-full ${device ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <span className="text-zinc-500 font-bold uppercase tracking-wider">DEVICE:</span>
                  <span className={`${device ? 'text-emerald-400' : 'text-yellow-500'} font-bold uppercase tracking-wider`}>
                      {device ? "READY" : "INITIALIZING"}
                  </span>
              </div>
              
              {adapter && (
                  <>
                      <div className="w-px h-3 bg-zinc-800 mx-2" />
                      <div className="flex gap-1">
                          <span className="text-zinc-600">VRAM:</span>
                          {/* @ts-ignore */}
                          <span className="text-zinc-400">{(adapter.limits.maxBufferSize / (1024*1024)).toFixed(0)}MB (Max Buf)</span>
                      </div>
                      <div className="flex gap-1">
                          <span className="text-zinc-600">TEX:</span>
                          {/* @ts-ignore */}
                          <span className="text-zinc-400">{adapter.limits.maxTextureDimension2D}px</span>
                      </div>
                  </>
              )}
          </div>
          {gpuError && <div className="text-red-500 font-bold">{gpuError}</div>}
      </div>
    </div>
  );
}