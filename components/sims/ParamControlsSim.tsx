import React from 'react';
import { SimParam } from '../../types';
import { Sliders, ToggleLeft, Hash } from 'lucide-react';

interface ParamControlsSimProps {
  params: SimParam[];
  onParamChange: (id: string, val: any) => void;
}

export const ParamControlsSim: React.FC<ParamControlsSimProps> = ({ params, onParamChange }) => {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 font-sans text-xs">
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-800/30 flex justify-between items-center">
        <span className="font-bold text-zinc-300 tracking-wide">PARAMETERS</span>
        <div className="flex gap-2">
           <Sliders size={12} className="text-zinc-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {params.map(p => (
          <div key={p.id} className="group">
             <div className="flex justify-between mb-1">
                <label className="text-zinc-400 font-medium">{p.label}</label>
                <span className="text-[10px] text-zinc-600 font-mono">{String(p.value)}</span>
             </div>
             
             {p.type === 'float' && (
               <div className="flex items-center gap-2">
                 <input 
                   type="range" 
                   min={p.min} max={p.max} step={p.step}
                   value={p.value}
                   onChange={(e) => onParamChange(p.id, parseFloat(e.target.value))}
                   className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
               </div>
             )}

             {p.type === 'int' && (
                <div className="flex items-center gap-2 border border-zinc-700 bg-zinc-950 rounded-sm p-1">
                   <Hash size={10} className="text-zinc-600" />
                   <input 
                      type="number" 
                      value={p.value}
                      onChange={(e) => onParamChange(p.id, parseInt(e.target.value))}
                      className="w-full outline-none text-zinc-200 bg-transparent font-mono text-[10px]"
                   />
                </div>
             )}

             {p.type === 'bool' && (
                <button 
                  onClick={() => onParamChange(p.id, !p.value)}
                  className={`flex items-center gap-2 px-2 py-1 rounded-sm border transition-colors ${
                      p.value ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                    <ToggleLeft size={12} className={p.value ? "rotate-180" : ""} />
                    {p.value ? "ENABLED" : "DISABLED"}
                </button>
             )}

             {p.type === 'vec3' && (
               <div className="grid grid-cols-3 gap-1">
                  {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis} className="flex items-center bg-zinc-950 rounded-sm px-1 border border-zinc-800">
                       <span className={`text-[9px] font-bold mr-1 ${
                           i===0 ? 'text-red-500' : i===1 ? 'text-green-500' : 'text-blue-500'
                       }`}>{axis.toUpperCase()}</span>
                       <input 
                         className="w-full bg-transparent outline-none font-mono text-[9px] text-zinc-300"
                         value={p.value[i]}
                         onChange={(e) => {
                             const newVal = [...p.value];
                             newVal[i] = parseFloat(e.target.value);
                             onParamChange(p.id, newVal);
                         }}
                       />
                    </div>
                  ))}
               </div>
             )}
          </div>
        ))}

        {params.length === 0 && (
            <div className="text-center py-8 text-zinc-700 italic">
                No parameters exposed by active kernel.
            </div>
        )}
      </div>
    </div>
  );
};