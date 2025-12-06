import React, { useEffect, useRef, useState } from 'react';
import { BoldButton } from '../ui/Core';
import { Pause, Play, RotateCcw } from 'lucide-react';

export const DataSim: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  
  // Refs for loop state to avoid React re-renders for every frame
  const historyRef = useRef<number[]>(new Array(120).fill(0));
  const lastTimeRef = useRef<number>(0);
  const reqRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  // Decoupled UI state (updates only ~2x per second to save DOM costs)
  const [stats, setStats] = useState({ fps: 60, ms: 16.6 });

  useEffect(() => {
    const render = (time: number) => {
      if (paused) return;
      
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // Update history (clamp spikes for visibility)
      historyRef.current.push(Math.min(delta, 100)); 
      if (historyRef.current.length > 120) historyRef.current.shift();
      
      // Draw to Canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear (Dark Grey)
        ctx.fillStyle = '#18181b'; // zinc-900
        ctx.fillRect(0, 0, w, h);
        
        // Draw Grid (Lightweight)
        ctx.beginPath();
        ctx.strokeStyle = '#27272a'; // zinc-800
        ctx.lineWidth = 1;
        // Vertical lines
        for (let i = w % 40; i < w; i += 40) { 
            ctx.moveTo(i + 0.5, 0); 
            ctx.lineTo(i + 0.5, h); 
        }
        // Horizontal lines
        for (let i = h % 40; i < h; i += 40) { 
            ctx.moveTo(0, i + 0.5); 
            ctx.lineTo(w, i + 0.5); 
        }
        ctx.stroke();
        
        // Draw Graph Line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.lineWidth = 1.5;
        
        const len = historyRef.current.length;
        const step = w / (len - 1 || 1);
        const maxMs = 50; // Fixed scale: 0-50ms
        
        for (let i = 0; i < len; i++) {
          const val = historyRef.current[i];
          const y = h - (val / maxMs) * h;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * step, y);
        }
        ctx.stroke();

        // Draw 16.6ms target line (60fps)
        const targetY = h - (16.66 / maxMs) * h;
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, targetY);
        ctx.lineTo(w, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Throttle UI updates to prevent React from choking
      frameCountRef.current++;
      if (frameCountRef.current % 30 === 0) {
         setStats({
             fps: Math.round(1000 / (delta || 16)),
             ms: delta
         });
      }

      reqRef.current = requestAnimationFrame(render);
    };
    
    reqRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(reqRef.current);
  }, [paused]);

  // Handle Resize
  useEffect(() => {
      const obs = new ResizeObserver(entries => {
          if (!canvasRef.current) return;
          const { width, height } = entries[0].contentRect;
          // Set internal resolution to match display size for sharpness
          canvasRef.current.width = width;
          canvasRef.current.height = height;
      });
      if (containerRef.current) obs.observe(containerRef.current);
      return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900">
      <div className="flex justify-between items-center px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="text-[10px] text-zinc-500 font-mono">MONITOR: FRAME_TIME</div>
        <div className="flex gap-1">
           <BoldButton variant="icon" onClick={() => setPaused(!paused)}>
             {paused ? <Play size={12} /> : <Pause size={12} />}
           </BoldButton>
           <BoldButton variant="icon" onClick={() => historyRef.current = new Array(120).fill(0)}>
             <RotateCcw size={12} />
           </BoldButton>
        </div>
      </div>

      <div className="flex-1 relative min-h-0 bg-zinc-900" ref={containerRef}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* Overlay Stats */}
        <div className="absolute top-2 right-4 pointer-events-none text-right">
          <div className="flex flex-col bg-zinc-900/80 backdrop-blur-sm p-2 rounded-sm border border-zinc-700 shadow-sm">
              <span className="text-2xl font-bold tracking-tighter text-zinc-100 tabular-nums leading-none">
                {stats.fps}<span className="text-[10px] text-zinc-500 font-normal ml-1">FPS</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-1">
                {stats.ms.toFixed(2)}ms
              </span>
          </div>
        </div>
      </div>
    </div>
  );
};