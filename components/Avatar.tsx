
import React from 'react';
import { AgentState } from '../types';
import { AVATAR_IMAGE_URL } from '../constants';

interface AvatarProps {
  state: AgentState;
  volume: number;
}

export const Avatar: React.FC<AvatarProps> = ({ state, volume }) => {
  
  const isSpeaking = state === AgentState.SPEAKING;
  const isListening = state === AgentState.LISTENING;
  
  return (
    <div className="relative flex justify-center items-center py-4 h-[500px] w-full max-w-md mx-auto perspective-1000">
      
      {/* Background Glow / Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-500
          ${isSpeaking ? 'bg-fuchsia-600 scale-110' : isListening ? 'bg-cyan-600' : 'bg-transparent'}
        `}
      />

      {/* Main Avatar Container - Floats to simulate 3D movement */}
      <div 
        className={`
          relative z-10 w-full h-full flex justify-center items-center
          animate-float transition-transform duration-200 ease-out
        `}
        style={{
            // Simulate speaking gesture by slight scaling based on volume
            transform: isSpeaking ? `scale(${1 + (volume / 800)})` : 'scale(1)',
        }}
      >
        <div className="relative w-auto h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
            <img 
                src={AVATAR_IMAGE_URL} 
                alt="3D Robot Avatar" 
                className="w-full h-full object-cover object-center"
            />
            
            {/* Status Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
                {isSpeaking && (
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span>
                    </span>
                )}
                 {isListening && (
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                )}
            </div>
            
            {/* Offline Overlay */}
            {state === AgentState.DISCONNECTED && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-gray-400 font-mono text-xl tracking-widest mb-2">SYSTEM OFFLINE</div>
                        <div className="text-gray-600 text-sm">INITIALIZE TO ACTIVATE AVATAR</div>
                    </div>
                </div>
            )}
             {/* Connecting Overlay */}
             {state === AgentState.CONNECTING && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                     <div className="text-cyan-400 font-mono animate-pulse tracking-widest">ESTABLISHING LINK...</div>
                </div>
            )}
        </div>
      </div>
      
      {/* Floor Reflection / Shadow */}
      <div className="absolute bottom-0 w-48 h-4 bg-black/50 blur-xl rounded-[100%] animate-pulse"></div>

    </div>
  );
};
