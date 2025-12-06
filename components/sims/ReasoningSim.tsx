import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BoldButton, BoldInput } from '../ui/Core';
import { Loader2, SendHorizontal } from 'lucide-react';

export const ReasoningSim: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleReason = async () => {
    if (!prompt.trim()) return;
    if (!process.env.API_KEY) {
      setResponse("Error: API_KEY is missing.");
      return;
    }

    setLoading(true);
    setResponse(''); 
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const resultStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a concise technical assistant. Output plain text or markdown. Be extremely brief and direct.",
        }
      });

      for await (const chunk of resultStream) {
        setResponse(prev => prev + chunk.text);
      }

    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Processing failed'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900">
      <div 
        className="flex-1 overflow-y-auto p-4 bg-zinc-900" 
        ref={scrollRef}
      >
        {response ? (
          <div className="prose prose-sm prose-invert max-w-none text-xs text-zinc-300 leading-relaxed font-mono">
             <div className="whitespace-pre-wrap">{response}</div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
                <div className="w-1 h-1 bg-zinc-500 rounded-full" />
            </div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Idle</span>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-zinc-800 bg-zinc-800/50 flex gap-2">
        <BoldInput 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleReason()}
          placeholder="Query..."
          disabled={loading}
          className="bg-zinc-950 h-8 text-xs border-zinc-700 text-zinc-200"
        />
        <BoldButton 
          variant="solid"
          onClick={handleReason} 
          disabled={loading || !prompt.trim()}
          className="w-8 h-8 px-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700"
        >
           {loading ? <Loader2 size={12} className="animate-spin" /> : <SendHorizontal size={12} />}
        </BoldButton>
      </div>
    </div>
  );
};