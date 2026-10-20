import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';


export interface SpeakOptions {
  text: string;
  token: string;
  region: string;
  language: string;        // e.g. 'en-US'
  voiceName: string;        // e.g. 'en-US-AriaNeural'
  onAudioStarted?: () => void;
  onAudioEnded?: () => void;
  onError?: (err: string) => void;
}

// Track the active synthesizer so we can cancel mid-speech
let activeSynthesizer: SpeechSDK.SpeechSynthesizer | null = null;

/**
 * Stop any currently-active TTS playback.
 */
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

/**
 * Speak the given text using Azure Speech Synthesis.
 * Plays audio through the default speaker output.
 */
export async function speakText(opts: SpeakOptions): Promise<void> {
  const {
    text,
    token,
    region,
    language,
    voiceName,
    onAudioStarted,
    onAudioEnded,
    onError,
  } = opts;

  if (!text.trim()) return;

  // Stop any existing speech
  stopSpeaking();

  try {
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechSynthesisLanguage = language;
    speechConfig.speechSynthesisVoiceName = voiceName;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    activeSynthesizer = synthesizer;

    let audioStarted = false;

    return new Promise<void>((resolve) => {
      // synthesizing fires when audio chunks start arriving
      synthesizer.synthesizing = () => {
        if (!audioStarted) {
          audioStarted = true;
          onAudioStarted?.();
        }
      };

      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            onAudioEnded?.();
          } else {
            onError?.(`TTS finished with reason: ${result.reason}`);
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
        },
        (err) => {
          console.error('[azureTTS] speakTextAsync error:', err);
          onError?.(typeof err === 'string' ? err : 'TTS error');
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
    activeSynthesizer = null;
  }
}
