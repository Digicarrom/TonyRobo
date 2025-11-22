export enum AgentState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING', // User is speaking or channel open
  SPEAKING = 'SPEAKING',   // AI is speaking
  THINKING = 'THINKING'    // Processing
}

export interface LogEntry {
  id: string;
  source: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
}
