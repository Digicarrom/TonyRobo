import React from 'react';
import { Avatar } from './components/Avatar';
import { Controls } from './components/Controls';
import { Transcript } from './components/Transcript';
import { useLiveAgent } from './hooks/useLiveAgent';

const App: React.FC = () => {
  const { state, logs, volume, connect, disconnect } = useLiveAgent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
            NOVA INTERFACE
          </h1>
        </div>
        <div className="text-xs font-mono text-gray-500 border border-gray-800 px-3 py-1 rounded-full">
          STATUS: <span className={state === 'DISCONNECTED' ? 'text-red-400' : 'text-green-400'}>{state}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl flex flex-col items-center">
        
        <div className="text-center mb-8 space-y-2">
           <h2 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
             AI Voice Assistant
           </h2>
           <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
             Experience real-time, multimodal conversation powered by Gemini 2.5.
           </p>
        </div>

        <Avatar state={state} volume={volume} />
        
        <Controls state={state} onConnect={connect} onDisconnect={disconnect} />

        <Transcript logs={logs} />
        
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 pt-6 border-t border-gray-800/50 text-center text-gray-600 text-xs flex justify-between">
         <span>POWERED BY GOOGLE GEMINI</span>
         <span className="font-mono">V.1.0.4</span>
      </footer>
    </div>
  );
};

export default App;
