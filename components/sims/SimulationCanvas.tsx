import React, { useEffect, useRef, useState } from 'react';
import { WebGPURenderer } from '../framework/WebGPURenderer';
import { OctagonPause } from 'lucide-react';

interface SimulationCanvasProps {
  device: GPUDevice | null;
  active?: boolean;
  onRendererInit?: (renderer: WebGPURenderer) => void;
}

// Memoized to prevent context destruction on parent re-renders
export const SimulationCanvas = React.memo(({ device, active = true, onRendererInit }: SimulationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Init Renderer
  useEffect(() => {
    if (!device || !canvasRef.current) return;

    // Prevent re-initialization if context already exists and device hasn't changed
    if (rendererRef.current && rendererRef.current.device === device) {
        return;
    }

    const ctx = canvasRef.current.getContext('webgpu');
    if (!ctx) return;

    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: 'premultiplied' });

    const renderer = new WebGPURenderer(device, ctx, format);
    rendererRef.current = renderer;
    
    // Notify parent so it can build UI
    if (onRendererInit) {
        onRendererInit(renderer);
    }

    const renderLoop = () => {
      // Hard stop if inactive to prevent GPU flooding
      if (active) {
          renderer.render();
          animationRef.current = requestAnimationFrame(renderLoop);
      }
    };
    
    if (active) {
        renderLoop();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [device, active, onRendererInit]); 

  // Resize Observer with High-DPI support
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        let width: number;
        let height: number;
        
        // Try to use devicePixelContentBoxSize for 1:1 pixel mapping (Chrome/Edge)
        if (entry.devicePixelContentBoxSize && entry.devicePixelContentBoxSize.length > 0) {
           width = entry.devicePixelContentBoxSize[0].inlineSize;
           height = entry.devicePixelContentBoxSize[0].blockSize;
        } else if (entry.contentBoxSize) {
           // Fallback for Firefox/Safari: manually multiply by DPR
           const dpr = window.devicePixelRatio || 1;
           width = entry.contentBoxSize[0].inlineSize * dpr;
           height = entry.contentBoxSize[0].blockSize * dpr;
        } else {
           // Legacy fallback
           const dpr = window.devicePixelRatio || 1;
           width = entry.contentRect.width * dpr;
           height = entry.contentRect.height * dpr;
        }

        // Clamp dimensions to avoid 0x0 crashes
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));

        if (rendererRef.current) {
             rendererRef.current.resize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => active && rendererRef.current?.onMouseDown(e);
  const handleMouseMove = (e: React.MouseEvent) => active && rendererRef.current?.onMouseMove(e);
  const handleMouseUp = () => active && rendererRef.current?.onMouseUp();
  const handleWheel = (e: React.WheelEvent) => active && rendererRef.current?.onWheel(e);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full bg-[#1a1b1e] overflow-hidden relative"
    >
      <div className="absolute top-4 left-4 z-10 text-[10px] text-white/50 font-mono pointer-events-none">
        VIEWPORT // {active ? 'ACTIVE' : 'HALTED'}
      </div>
      
      {!device && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">
           INITIALIZING GPU CONTEXT...
        </div>
      )}

      {!active && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 text-red-500 gap-2">
             <OctagonPause size={48} />
             <span className="font-bold tracking-widest">RENDER LOOP TERMINATED</span>
             <span className="text-xs text-gray-400">Resolve errors in System Logs to resume.</span>
         </div>
      )}

      <canvas
        ref={canvasRef}
        className={`w-full h-full block cursor-crosshair transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}, (prev, next) => prev.device === next.device && prev.active === next.active);