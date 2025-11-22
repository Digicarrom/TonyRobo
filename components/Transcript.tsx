import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TranscriptProps {
  logs: LogEntry[];
}

export const Transcript: React.FC<TranscriptProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 h-64 overflow-y-auto scrollbar-hide border-t border-gray-800 bg-black/20 rounded-xl p-4 backdrop-blur-sm">
      <div className="space-y-4">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`flex flex-col ${
                log.source === 'user' ? 'items-end' : 
                log.source === 'agent' ? 'items-start' : 'items-center'
            }`}
          >
             {log.source !== 'system' && (
                 <span className={`text-xs mb-1 ${
                     log.source === 'user' ? 'text-cyan-400' : 'text-fuchsia-400'
                 }`}>
                     {log.source === 'user' ? 'YOU' : 'NOVA'}
                 </span>
             )}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                log.source === 'user' 
                  ? 'bg-cyan-900/40 text-cyan-50 rounded-tr-none border border-cyan-800' 
                  : log.source === 'agent'
                  ? 'bg-fuchsia-900/40 text-fuchsia-50 rounded-tl-none border border-fuchsia-800'
                  : 'text-gray-500 text-xs italic'
              }`}
            >
              {log.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
