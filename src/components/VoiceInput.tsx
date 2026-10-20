import { useEffect, useState } from 'react';
import { useAzureSpeechRecognition } from '../hooks/useAzureSpeechRecognition';
import type { ConversationStatus } from '../types/conversation';
import Icon from './Icon';

interface VoiceInputProps {
  onTextSubmit: (text: string) => void;
  onCancel?: () => void;
  status?: ConversationStatus;
  disabled?: boolean;
  token: string | null;
  region: string;
}

export default function VoiceInput({
  onTextSubmit,
  onCancel,
  status = 'idle',
  disabled = false,
  token,
  region,
}: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const {
    startListening,
    stopListening,
    isListening,
    partialTranscript,
    finalTranscript,
    error: recognitionError,
  } = useAzureSpeechRecognition({ token, region, enabled: !!token });

  // Sync text field from Azure transcripts
  useEffect(() => {
    if (isListening && partialTranscript) {
      setText(partialTranscript);
    } else if (!isListening && finalTranscript) {
      setText(finalTranscript);
    }
  }, [isListening, partialTranscript, finalTranscript]);

  // Stop listening if user transitions to a busy state
  useEffect(() => {
    if (isRecording && (status === 'thinking' || status === 'speaking')) {
      stopListening();
      setIsRecording(false);
    }
  }, [status, isRecording, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const isBusy =
    disabled ||
    status === 'thinking' ||
    status === 'transcribing' ||
    status === 'speaking';

  const canCancel =
    !!onCancel &&
    (status === 'thinking' || status === 'transcribing' || status === 'speaking');

  const tokenLoading = !token && !recognitionError;
  const micDisabled = isBusy || tokenLoading || !token;

  const handleMicClick = async () => {
    if (isRecording) {
      await stopListening();
      setIsRecording(false);
    } else {
      const success = await startListening();
      setIsRecording(success);
    }
  };

  const handleClear = () => {
    setText('');
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isBusy) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isRecording) {
      stopListening();
      setIsRecording(false);
    }

    onTextSubmit(trimmed);
    setText('');
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const showClear = (text.length > 0 || (isListening && partialTranscript.length > 0)) && !isBusy;

  return (
    <div className="space-y-1">
      {tokenLoading && (
        <p className="text-xs text-gray-500">Connecting to Azure Speech...</p>
      )}
      {recognitionError && (
        <p className="text-xs text-red-500">⚠ {recognitionError}</p>
      )}

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
              ? 'Listening... (click mic to stop)'
              : 'Type or speak...'
          }
          disabled={isBusy}
          className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
        />

        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Clear input"
          >
            <Icon name="x" size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={handleMicClick}
          disabled={micDisabled}
          className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          title={
            tokenLoading
              ? 'Connecting to Azure...'
              : isRecording
                ? 'Stop recording'
                : 'Start voice input'
          }
        >
          <Icon name={isRecording ? 'mic-off' : 'mic'} size={20} />
        </button>

        {canCancel ? (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium text-sm cursor-pointer flex items-center gap-1.5"
            title="Stop"
          >
            <Icon name="stop" size={14} />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isBusy || !text.trim()}
            className="px-4 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="send" size={16} />
            <span>Send</span>
          </button>
        )}
      </form>
    </div>
  );
}
