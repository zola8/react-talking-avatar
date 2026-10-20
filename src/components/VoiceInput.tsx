import { useEffect, useRef, useState } from 'react';
import type { ConversationStatus } from '../types/conversation';
import Icon from './Icon';


interface VoiceInputProps {
  onSubmit: (text: string, audioBlob?: Blob) => void;
  status?: ConversationStatus;
  disabled?: boolean;
}

export default function VoiceInput({
  onSubmit,
  status = 'idle',
  disabled = false,
}: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Derive "busy" from status — true while waiting for AI/transcribing
  const isBusy =
    disabled ||
    status === 'thinking' ||
    status === 'transcribing' ||
    status === 'speaking';

  // Sync local "listening" state with external "listening" status (so the mic
  // button stays red if the parent sets status to 'listening')
  useEffect(() => {
    if (status === 'listening' && !isRecording) {
      // Parent says we should be listening — start
      handleMicClick();
    } else if (status !== 'listening' && isRecording) {
      // Parent says we should stop — stop
      stopRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      console.log('[VoiceInput] Recording started, mimeType:', mimeType);
    } catch (err) {
      console.error('[VoiceInput] Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    } else {
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
    if (isBusy) return;
    const trimmed = text.trim();

    let audioBlob: Blob | undefined;
    if (audioChunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log('[VoiceInput] Audio blob:', audioBlob.size, 'bytes', audioBlob.type);
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
      className={`flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-2 transition-colors ${isRecording
          ? 'border-red-300 ring-2 ring-red-200'
          : 'border-gray-300 focus-within:ring-2 focus-within:ring-stone-500'
        }`}
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
        disabled={isBusy}
        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
      />

      {isSupported && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isBusy}
          className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          <Icon name={isRecording ? 'mic-off' : 'mic'} size={20} />
        </button>
      )}

      <button
        type="submit"
        disabled={isBusy || !text.trim()}
        className="px-4 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
      >
        <Icon name="send" size={16} />
        <span>Send</span>
      </button>
    </form>
  );
}
