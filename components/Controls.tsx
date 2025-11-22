import React from 'react';
import { AgentState } from '../types';

interface ControlsProps {
  state: AgentState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ state, onConnect, onDisconnect }) => {
  const isConnected = state !== AgentState.DISCONNECTED;

  return (
    <div className="flex justify-center gap-4 mt-8">
      {!isConnected ? (
        <button
          onClick={onConnect}
          className="group relative px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            START CONVERSATION
          </span>
          <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-30 group-hover:animate-ping"></div>
        </button>
      ) : (
        <button
          onClick={onDisconnect}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold tracking-wider transition-all duration-300 shadow-lg hover:shadow-red-500/50"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            DISCONNECT
          </span>
        </button>
      )}
    </div>
  );
};
