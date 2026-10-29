import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {
  type LipSyncController,
  resetLipSyncController,
} from '../types/viseme';

export interface SpeakOptions {
  text: string;
  token: string;
  region: string;
  language: string;
  voiceName: string;
  lipSyncController?: LipSyncController;
  onAudioStarted?: () => void;
  onAudioEnded?: () => void;
  onError?: (err: string) => void;
}

let activeSynthesizer: SpeechSDK.SpeechSynthesizer | null = null;

function closeSynthesizer(synth: SpeechSDK.SpeechSynthesizer): void {
  try {
    synth.close();
  } catch {
    // ignore
  }
  if (activeSynthesizer === synth) {
    activeSynthesizer = null;
  }
}

export function stopSpeaking(): void {
  if (activeSynthesizer) {
    closeSynthesizer(activeSynthesizer);
  }
}

export async function speakText(opts: SpeakOptions): Promise<void> {
  const {
    text,
    token,
    region,
    language,
    voiceName,
    lipSyncController,
    onAudioStarted,
    onAudioEnded,
    onError,
  } = opts;

  if (!text.trim()) return;

  stopSpeaking();

  if (lipSyncController) {
    resetLipSyncController(lipSyncController);
  }

  try {
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechSynthesisLanguage = language;
    speechConfig.speechSynthesisVoiceName = voiceName;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    activeSynthesizer = synthesizer;

    let audioStarted = false;

    return new Promise<void>((resolve) => {
      synthesizer.visemeReceived = (_s, e) => {
        if (!lipSyncController) return;
        const offsetMs = Number(e.audioOffset) / 10000;
        lipSyncController.events.push({
          offsetMs,
          visemeId: e.visemeId,
        });
      };

      synthesizer.synthesizing = () => {
        if (!audioStarted) {
          audioStarted = true;
          onAudioStarted?.();
          if (lipSyncController) {
            lipSyncController.audioStartTime = performance.now();
          }
        }
      };

      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            onAudioEnded?.();
            if (lipSyncController && lipSyncController.audioStartTime !== null) {
              const durationMs = Number(result.audioDuration) / 10000;
              lipSyncController.audioEndTime =
                lipSyncController.audioStartTime + durationMs;
            }
          } else {
            const detail =
              result.reason === SpeechSDK.ResultReason.Canceled
                ? result.errorDetails
                : undefined;
            console.error('[azureTTS] synthesis failed:', {
              reason: result.reason,
              errorDetails: detail,
            });
            onError?.(detail ?? `TTS finished with reason: ${result.reason}`);
            if (lipSyncController) {
              lipSyncController.active = false;
            }
          }
          closeSynthesizer(synthesizer);
          resolve();
        },
        (err) => {
          console.error('[azureTTS] speakTextAsync error:', err);
          onError?.(typeof err === 'string' ? err : 'TTS error');
          if (lipSyncController) {
            lipSyncController.active = false;
          }
          closeSynthesizer(synthesizer);
          resolve();
        },
      );
    });
  } catch (err: unknown) {
    console.error('[azureTTS] speakText failed:', err);
    const message = err instanceof Error ? err.message : 'TTS failed';
    onError?.(message);
    if (lipSyncController) {
      lipSyncController.active = false;
    }
    if (activeSynthesizer) {
      closeSynthesizer(activeSynthesizer);
    }
  }
}
