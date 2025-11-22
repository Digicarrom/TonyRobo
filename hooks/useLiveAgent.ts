import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AgentState, LogEntry } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { decodeAudioData, pcmToGeminiBlob } from '../utils/audioUtils';

export const useLiveAgent = () => {
  const [state, setState] = useState<AgentState>(AgentState.DISCONNECTED);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [volume, setVolume] = useState<number>(0); // 0 to 100 for visualizer

  // Audio Contexts
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  
  // Processing Nodes
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Playback management
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Transcription buffers
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  // Connection Ref (to avoid closure staleness)
  const sessionRef = useRef<any>(null);

  const addLog = useCallback((source: LogEntry['source'], text: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      source,
      text,
      timestamp: new Date()
    }]);
  }, []);

  const disconnect = useCallback(async () => {
    if (sessionRef.current) {
        try {
           // session.close() is not always available on the interface depending on version,
           // but let's try to clean up gracefully
        } catch (e) {
            console.warn("Error closing session", e);
        }
        sessionRef.current = null;
    }

    // Stop all audio sources
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();

    // Close Input Context
    if (inputCtxRef.current) {
      inputCtxRef.current.close();
      inputCtxRef.current = null;
    }

    // Close Output Context
    if (outputCtxRef.current) {
      outputCtxRef.current.close();
      outputCtxRef.current = null;
    }

    setState(AgentState.DISCONNECTED);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    try {
      setState(AgentState.CONNECTING);
      addLog('system', 'Initializing audio...');

      // 1. Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      // 2. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 3. Setup Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      addLog('system', 'Connecting to Gemini Live...');

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: {}, // Enable input transcription
          outputAudioTranscription: {}, // Enable output transcription
        },
        callbacks: {
          onopen: () => {
            addLog('system', 'Connected!');
            setState(AgentState.LISTENING);
            
            // Start Input Stream Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            sourceRef.current = source;
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 500, 100)); // Scale for UI

              // Create Blob and Send
              const pcmBlob = pcmToGeminiBlob(inputData, 16000);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcription
            if (msg.serverContent?.outputTranscription) {
               const text = msg.serverContent.outputTranscription.text;
               currentOutputTransRef.current += text;
            } else if (msg.serverContent?.inputTranscription) {
               const text = msg.serverContent.inputTranscription.text;
               currentInputTransRef.current += text;
            }

            if (msg.serverContent?.turnComplete) {
               if (currentInputTransRef.current) {
                 addLog('user', currentInputTransRef.current);
                 currentInputTransRef.current = '';
               }
               if (currentOutputTransRef.current) {
                 addLog('agent', currentOutputTransRef.current);
                 currentOutputTransRef.current = '';
                 setState(AgentState.LISTENING);
               }
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                setState(AgentState.SPEAKING);
                
                // Ensure timing
                if (outputCtxRef.current) {
                    nextStartTimeRef.current = Math.max(
                        nextStartTimeRef.current,
                        outputCtxRef.current.currentTime
                    );

                    const audioBuffer = await decodeAudioData(
                        // We used base64ToUint8Array in the audioUtils, but here we need to decode from the SDK's format
                        // The SDK returns base64 string
                        Uint8Array.from(atob(audioData), c => c.charCodeAt(0)),
                        outputCtxRef.current,
                        24000,
                        1
                    );

                    const source = outputCtxRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    
                    // Connect to destination
                    source.connect(outputCtxRef.current.destination);
                    
                    source.addEventListener('ended', () => {
                        activeSourcesRef.current.delete(source);
                        // If no sources left, we are done speaking technically, but turnComplete handles the state transition usually
                        // However, for visualizer, we might want to know.
                    });
                    
                    source.start(nextStartTimeRef.current);
                    activeSourcesRef.current.add(source);
                    
                    nextStartTimeRef.current += audioBuffer.duration;
                }
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                addLog('system', 'Interrupted');
                activeSourcesRef.current.forEach(s => s.stop());
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                currentOutputTransRef.current = ''; 
                setState(AgentState.LISTENING);
            }
          },
          onclose: () => {
            addLog('system', 'Session closed');
            disconnect();
          },
          onerror: (e) => {
            console.error(e);
            addLog('system', 'Error occurred');
            disconnect();
          }
        }
      });
      
      // Store session for later use if needed (though mostly handled via promise closure)
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      addLog('system', 'Failed to connect: ' + (err instanceof Error ? err.message : String(err)));
      disconnect();
    }
  }, [addLog, disconnect]);

  return {
    state,
    logs,
    volume,
    connect,
    disconnect
  };
};