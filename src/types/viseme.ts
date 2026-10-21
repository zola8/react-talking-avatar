export interface VisemeEvent {
  offsetMs: number;
  visemeId: number;
}

export interface LipSyncController {
  events: VisemeEvent[];
  audioStartTime: number | null;
  audioEndTime: number | null;
  nextEventIndex: number;
  active: boolean;
}

export function createLipSyncController(): LipSyncController {
  return {
    events: [],
    audioStartTime: null,
    audioEndTime: null,
    nextEventIndex: 0,
    active: false,
  };
}

export function resetLipSyncController(controller: LipSyncController): void {
  controller.events = [];
  controller.audioStartTime = null;
  controller.audioEndTime = null;
  controller.nextEventIndex = 0;
  controller.active = true;
}

export function deactivateLipSyncController(controller: LipSyncController): void {
  controller.active = false;
}

export interface VisemeMapping {
  preset: string;
  intensity: number;
}

const VRM_PRESETS = {
  open: ['aa', 'a'],
  wide: ['ih', 'ee', 'i', 'e'],
  round: ['ou', 'oh', 'u', 'o'],
};

// Use 'closed' sentinel for silence visemes so ?? doesn't eat it
type VisemeEntry = { category: keyof typeof VRM_PRESETS; intensity: number } | 'closed';

const AZURE_VISEME_MAP: Record<number, VisemeEntry> = {
  // Silence / closed mouth
  0: 'closed',
  20: 'closed',
  21: 'closed',
  22: 'closed',

  // Open (a, aa, ae)
  1: { category: 'open', intensity: 0.8 },
  2: { category: 'open', intensity: 1.0 },
  3: { category: 'open', intensity: 1.0 },
  4: { category: 'open', intensity: 0.7 },
  13: { category: 'open', intensity: 0.6 },
  14: { category: 'open', intensity: 0.5 },
  15: { category: 'open', intensity: 0.4 },
  19: { category: 'open', intensity: 0.4 },

  // Wide (i, e)
  5: { category: 'wide', intensity: 0.8 },
  6: { category: 'wide', intensity: 0.9 },
  11: { category: 'wide', intensity: 0.8 },
  12: { category: 'wide', intensity: 0.9 },

  // Rounded (u, o, oe)
  7: { category: 'round', intensity: 0.9 },
  8: { category: 'round', intensity: 0.7 },
  9: { category: 'round', intensity: 0.9 },
  10: { category: 'round', intensity: 0.7 },
  16: { category: 'round', intensity: 0.6 },
  17: { category: 'round', intensity: 0.6 },
  18: { category: 'round', intensity: 0.7 },
};

export function resolveViseme(
  visemeId: number,
  availablePresets: Set<string>,
): VisemeMapping | null {
  const mapping = AZURE_VISEME_MAP[visemeId];

  // Explicit "closed" → no expression (silence)
  if (mapping === 'closed') return null;

  // Not in our map (viseme IDs 23-43) → default slight open
  const effectiveMapping = mapping ?? { category: 'open' as const, intensity: 0.3 };

  // Find a preset the model supports
  const candidates = VRM_PRESETS[effectiveMapping.category];
  for (const preset of candidates) {
    if (availablePresets.has(preset)) {
      return { preset, intensity: effectiveMapping.intensity };
    }
  }

  return null;
}
