import React, { useEffect, useRef, useState } from 'react';
import { BoldToggle, BoldButton } from '../ui/Core';
import { TriangleAlert, CircleCheck, Info, Copy, RotateCcw, PauseOctagon } from 'lucide-react';
import { LogEntry } from '../../types';

interface SystemLogSimProps {
  logs?: LogEntry[];
  isPaused?: boolean;
  onClear?: () => void;
  onCopyDebug?: () => void;
}

export const SystemLogSim: React.FC<SystemLogSimProps> = React.memo(({ 
    logs = [], 
    isPaused = false,
    onClear,
    onCopyDebug
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current && !isPaused) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const getLevelColor = (level: string) => {
      switch(level) {
          case 'ERR': return 'text-red-400 bg-red-900/20 border-red-900/40';
          case 'WARN': return 'text-amber-400 bg-amber-900/20 border-amber-900/40';
          case 'OK': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40';
          default: return 'text-blue-400 bg-blue-900/20 border-blue-900/40';
      }
  }

  const getIcon = (level: string) => {
     switch(level) {
          case 'ERR': return <TriangleAlert size={10} />;
          case 'WARN': return <TriangleAlert size={10} />;
          case 'OK': return <CircleCheck size={10} />;
          default: return <Info size={10} />;
     }
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 relative">
      {/* Visual Warning for Pause */}
      {isPaused && (
          <div className="absolute top-0 left-0 right-0 bg-red-900/90 text-red-100 border-b border-red-700 text-[10px] font-bold py-1 px-2 z-20 flex justify-between items-center shadow-md">
              <span className="flex items-center gap-2"><PauseOctagon size={12}/> LOGGING PAUSED (ERROR FLOOD)</span>
              <button onClick={onClear} className="bg-white text-red-900 px-2 rounded-sm hover:bg-gray-200">RESET</button>
          </div>
      )}

      <div className={`flex justify-between items-center px-3 py-2 border-b border-zinc-800 bg-zinc-800/30 ${isPaused ? 'mt-6' : ''}`}>
        <div className="flex items-center gap-2">
             <BoldButton variant="outline" className="h-6 px-2 text-[10px]" onClick={onCopyDebug}>
                <Copy size={10} /> COPY CONTEXT
             </BoldButton>
             <BoldButton variant="outline" className="h-6 px-2 text-[10px]" onClick={onClear}>
                <RotateCcw size={10} /> CLEAR
             </BoldButton>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex gap-2 text-[10px] text-zinc-500">
                <span>Errors: <span className="text-red-500 font-bold">{logs.filter(l => l.level === 'ERR').length}</span></span>
                <span>Events: <span className="text-blue-500 font-bold">{logs.length}</span></span>
             </div>
            <BoldToggle label="Auto-Scroll" checked={autoScroll} onChange={setAutoScroll} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-zinc-900 font-mono text-[10px] leading-relaxed p-0 scrollbar-thin scrollbar-thumb-zinc-700">
        <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-zinc-900 text-zinc-500 font-medium z-10 border-b border-zinc-800 shadow-sm">
                <tr>
                    <th className="py-1 px-2 w-20 bg-zinc-900">Time</th>
                    <th className="py-1 px-2 w-14 bg-zinc-900">Lvl</th>
                    <th className="py-1 px-2 w-20 bg-zinc-900">Source</th>
                    <th className="py-1 px-2 bg-zinc-900">Message</th>
                </tr>
            </thead>
            <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-600 italic">
                      Waiting for GPU events...
                    </td>
                  </tr>
                ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                    <td className="py-1 px-2 text-zinc-500 align-top">{log.ts}</td>
                    <td className="py-1 px-2 align-top">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border font-bold text-[9px] ${getLevelColor(log.level)}`}>
                            {getIcon(log.level)}
                            {log.level}
                        </span>
                    </td>
                    <td className="py-1 px-2 text-zinc-400 font-medium align-top">{log.category}</td>
                    <td className="py-1 px-2 text-zinc-300 break-words align-top font-sans select-text selection:bg-blue-900/50">{log.msg}</td>
                </tr>
                ))}
                <tr ref={bottomRef}></tr>
            </tbody>
        </table>
      </div>
    </div>
  );
});