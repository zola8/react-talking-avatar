// src/components/VoiceInput.tsx
import { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onSubmit: (text: string, audioBlob?: Blob) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onSubmit, disabled = false }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('[VoiceInput] Recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Pick best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Stream cleanup happens on send
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      console.log('[VoiceInput] Recording started, mimeType:', mimeType);
    } catch (err) {
      console.error('[VoiceInput] Failed to start recording:', err);
    }
  };

  // Stop audio recording (but keep chunks for send)
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      // Stop recording but keep the audio for send
      stopRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    } else {
      // Start both recording and speech recognition
      startRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('[VoiceInput] Failed to start recognition:', e);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();

    // Build audio blob from chunks
    let audioBlob: Blob | undefined;
    if (audioChunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // LOG audio details to console
      console.group('[VoiceInput] Audio Blob Details');
      console.log('Size:', audioBlob.size, 'bytes');
      console.log('Size (KB):', (audioBlob.size / 1024).toFixed(2), 'KB');
      console.log('Type:', audioBlob.type);
      console.log('Chunks collected:', audioChunksRef.current.length);
      console.log('Blob object:', audioBlob);
      console.groupEnd();
    } else {
      console.log('[VoiceInput] No audio recorded (text-only submission)');
    }

    // Cleanup stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];

    if (trimmed) {
      onSubmit(trimmed, audioBlob);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 focus-within:ring-2 focus-within:ring-stone-500"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isRecording
            ? 'Recording... (click mic again to stop)'
            : isListening
            ? 'Listening...'
            : 'Type or speak...'
        }
        disabled={disabled}
        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
      />

      {isSupported && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      )}

      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Send
      </button>
    </form>
  );
}
