import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAzureSpeechRecognitionArgs {
  token: string | null;
  region: string;
  enabled?: boolean;
}

interface UseAzureSpeechRecognitionReturn {
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<void>;
  isListening: boolean;
  partialTranscript: string;
  finalTranscript: string;
  error: string | null;
}

export function useAzureSpeechRecognition({
  token,
  region,
  enabled = true,
}: UseAzureSpeechRecognitionArgs): UseAzureSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const accumulatedRef = useRef<string>('');

  const cleanupRecognizer = useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.close();
      } catch {
        // ignore
      }
      recognizerRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cleanupRecognizer(), [cleanupRecognizer]);

  // If token is revoked mid-session, stop listening
  useEffect(() => {
    if (!token && recognizerRef.current) {
      cleanupRecognizer();
    }
  }, [token, cleanupRecognizer]);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!token || !enabled) {
      setError(!token ? 'No auth token' : 'Recognition disabled');
      return false;
    }
    if (recognizerRef.current) {
      console.warn('[useAzureSpeechRecognition] Already listening');
      return false;
    }

    setError(null);
    setPartialTranscript('');
    setFinalTranscript('');
    accumulatedRef.current = '';

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      // Use the default microphone input directly — Azure SDK handles permission
      // and audio format conversion internally.
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      recognizer.recognizing = (_s, e) => {
        if (e.result.text) {
          setPartialTranscript(e.result.text);
        }
      };

      recognizer.recognized = (_s, e) => {
        if (
          e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech &&
          e.result.text
        ) {
          accumulatedRef.current +=
            (accumulatedRef.current ? ' ' : '') + e.result.text;
          setFinalTranscript(accumulatedRef.current);
          setPartialTranscript('');
        }
      };

      recognizer.sessionStopped = () => {
        cleanupRecognizer();
      };

      recognizer.canceled = (_s, e) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error('[useAzureSpeechRecognition] Canceled:', e.errorDetails);
          setError(e.errorDetails ?? 'Recognition canceled');
        }
        cleanupRecognizer();
      };

      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(
          () => {
            setIsListening(true);
            resolve();
          },
          (err) => {
            console.error('[useAzureSpeechRecognition] Start failed:', err);
            setError(typeof err === 'string' ? err : 'Start failed');
            cleanupRecognizer();
            reject(err);
          }
        );
      });

      return true;
    } catch (err: any) {
      console.error('[useAzureSpeechRecognition] startListening failed:', err);
      setError(err?.message ?? 'Failed to start listening');
      cleanupRecognizer();
      return false;
    }
  }, [token, region, enabled, cleanupRecognizer]);

  const stopListening = useCallback(async () => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;

    await new Promise<void>((resolve) => {
      try {
        recognizer.stopContinuousRecognitionAsync(resolve, () => resolve());
      } catch {
        resolve();
      }
    });
    cleanupRecognizer();
  }, [cleanupRecognizer]);

  return {
    startListening,
    stopListening,
    isListening,
    partialTranscript,
    finalTranscript,
    error,
  };
}
