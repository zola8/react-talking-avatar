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

export function stopSpeaking(): void {
  if (activeSynthesizer) {
    try {
      activeSynthesizer.close();
    } catch {
      // ignore
    }
    activeSynthesizer = null;
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
            // Set audioEndTime based on the result's audioDuration.
            // audioDuration is in 100-nanosecond units.
            // We compute end time relative to audioStartTime (when synthesizing fired),
            // not "now", because synthesis may complete before playback finishes.
            if (lipSyncController && lipSyncController.audioStartTime !== null) {
              const durationMs = Number(result.audioDuration) / 10000;
              lipSyncController.audioEndTime =
                lipSyncController.audioStartTime + durationMs;
            }
          } else {
            onError?.(`TTS finished with reason: ${result.reason}`);
          }
          // NOTE: we do NOT call deactivateLipSyncController here.
          // useLipSync will detect when elapsed > audioEndTime and decay.
          try {
            synthesizer.close();
          } catch {
            // ignore
          }
          if (activeSynthesizer === synthesizer) {
            activeSynthesizer = null;
          }
          resolve();
        },
        (err) => {
          console.error('[azureTTS] speakTextAsync error:', err);
          onError?.(typeof err === 'string' ? err : 'TTS error');
          if (lipSyncController) {
            lipSyncController.active = false;
          }
          try {
            synthesizer.close();
          } catch {
            // ignore
          }
          if (activeSynthesizer === synthesizer) {
            activeSynthesizer = null;
          }
          resolve();
        }
      );
    });
  } catch (err: any) {
    console.error('[azureTTS] speakText failed:', err);
    onError?.(err?.message ?? 'TTS failed');
    if (lipSyncController) {
      lipSyncController.active = false;
    }
    activeSynthesizer = null;
  }
}
