# Audio Sensitivity Feature - Design Document

**Date:** 2025-11-05
**Status:** Approved for Implementation

## Overview

Add audio sensitivity controls to allow live adjustment of how strongly audio features drive visual parameters. This is a key VJ performance feature for balancing visual reactivity without changing preset mappings.

## Core Concept

Four sensitivity controls that scale audio analysis data at the source (AudioService) before it reaches parameter automation:

- **Master Sensitivity** - Global reactivity control
- **Low Sensitivity** - Scales bass + lowMid frequencies
- **Mid Sensitivity** - Scales mid + highMid frequencies
- **High Sensitivity** - Scales treble frequencies

## Design Decisions

### Ranges & Defaults
- **Range:** 5% - 300% for all controls
- **Default:** 100% (unity, no change)
- **Minimum:** 5% (prevents complete silence/dead visuals)
- **Maximum:** 300% (headroom for quiet sources and creative extremes)

### Smoothing Strategy
- **Master:** Smoothed over 200ms (live performance control)
- **Bands:** Instant application (tone shaping, set-and-forget)
- **Rationale:** Prevents sluggish feel from double-smoothing

### Value Handling
- **Allow values > 1.0:** Scaled audio values can exceed 1.0
- **No clipping in AudioService:** ParameterService handles clamping when needed
- **Example:** `bass (0.5) × low_sens (200%) × master_sens (150%) = 1.5`

### Persistence
- **Saved to:** `app-config.json` under `audio.sensitivity`
- **Scope:** App-wide, persists between sessions
- **Loading:** Applied on AudioService initialization
- **Saving:** Debounced 500ms after slider changes

### API Design
- **Accept percentage values:** 0-300 (integers)
- **Internal storage:** Same (100 = 100%, not 1.0)
- **UI-friendly:** No conversion needed between UI and API

## Architecture

### Data Flow

```
Raw Audio Input
  ↓
FFT Analysis → frequency bands (bass, lowMid, mid, highMid, treble)
  ↓
Update master sensitivity smoothing (200ms interpolation)
  ↓
Apply sensitivity scaling:
  - bass × (lowSensitivity / 100) × (masterSensitivity / 100)
  - lowMid × (lowSensitivity / 100) × (masterSensitivity / 100)
  - mid × (midSensitivity / 100) × (masterSensitivity / 100)
  - highMid × (midSensitivity / 100) × (masterSensitivity / 100)
  - treble × (highSensitivity / 100) × (masterSensitivity / 100)
  ↓
Emit 'audio:data' event with scaled values
  ↓
ParameterService automation uses scaled values
  ↓
Visuals react
```

### AudioService Changes

**New Properties:**
```typescript
class AudioService {
  // Master (smoothed)
  private masterSensitivity: number = 100;
  private targetMasterSensitivity: number = 100;
  private smoothingTime: number = 0.2; // 200ms

  // Bands (instant)
  private lowSensitivity: number = 100;
  private midSensitivity: number = 100;
  private highSensitivity: number = 100;

  // Constants
  private readonly MIN_SENSITIVITY = 5;
  private readonly MAX_SENSITIVITY = 300;
}
```

**New API Methods:**
```typescript
// Setters (accept 0-300 percentage values)
setMasterSensitivity(percent: number): void
setLowSensitivity(percent: number): void
setMidSensitivity(percent: number): void
setHighSensitivity(percent: number): void

// Getter
getSensitivities(): {
  master: number,
  low: number,
  mid: number,
  high: number
}
```

**Frame Processing Logic:**
```typescript
private processAudioFrame(): void {
  // 1. Update master sensitivity smoothing
  const deltaTime = this.getFrameDeltaTime();
  const alpha = Math.min(1, deltaTime / this.smoothingTime);
  this.masterSensitivity = lerp(
    this.masterSensitivity,
    this.targetMasterSensitivity,
    alpha
  );

  // 2. Get raw frequency bands from FFT
  const raw = this.analyzeFrequencyBands();

  // 3. Calculate combined sensitivities (as decimals)
  const masterDecimal = this.masterSensitivity / 100;
  const lowDecimal = this.lowSensitivity / 100;
  const midDecimal = this.midSensitivity / 100;
  const highDecimal = this.highSensitivity / 100;

  // 4. Apply scaling (values CAN exceed 1.0)
  const scaled = {
    bass: raw.bass * lowDecimal * masterDecimal,
    lowMid: raw.lowMid * lowDecimal * masterDecimal,
    mid: raw.mid * midDecimal * masterDecimal,
    highMid: raw.highMid * midDecimal * masterDecimal,
    treble: raw.treble * highDecimal * masterDecimal,
  };

  // 5. Emit scaled data
  this.eventBus.emit('audio:data', scaled);

  // 6. Check for clipping (optional warning)
  if (this.isClipping(scaled)) {
    this.eventBus.emit('audio:sensitivity-clipping');
  }
}
```

**Events:**
- `audio:sensitivity-changed` - Emitted when any sensitivity value changes
- `audio:sensitivity-clipping` - Optional warning when scaled values exceed threshold

### Configuration Format

**app-config.json:**
```json
{
  "audio": {
    "defaultDevice": "default",
    "sampleRate": 48000,
    "bufferSize": 2048,
    "sensitivity": {
      "master": 100,
      "low": 100,
      "mid": 100,
      "high": 100
    }
  }
}
```

**Loading on Startup:**
```typescript
class AudioService {
  async initialize(config: AudioConfig): Promise<void> {
    // ... existing initialization ...

    // Load persisted sensitivities (with fallback to defaults)
    const sens = config.sensitivity || {
      master: 100,
      low: 100,
      mid: 100,
      high: 100
    };

    this.setMasterSensitivity(sens.master);
    this.setLowSensitivity(sens.low);
    this.setMidSensitivity(sens.mid);
    this.setHighSensitivity(sens.high);
  }
}
```

**Saving Changes:**
```typescript
// AudioService emits change event
private emitSensitivityChange(): void {
  this.eventBus.emit('audio:sensitivity-changed', this.getSensitivities());
}

// Main process listens and persists
ipcMain.on('save-audio-sensitivity', (event, sensitivities) => {
  configStore.set('audio.sensitivity', sensitivities);
});
```

### UI Integration

**Control Panel:**
```html
<div class="audio-sensitivity-panel">
  <h3>Audio Sensitivity</h3>

  <div class="control-group">
    <label>Master</label>
    <input type="range" min="5" max="300" value="100"
           id="master-sensitivity" />
    <span class="value">100%</span>
  </div>

  <div class="control-group">
    <label>Low (Bass)</label>
    <input type="range" min="5" max="300" value="100"
           id="low-sensitivity" />
    <span class="value">100%</span>
  </div>

  <div class="control-group">
    <label>Mid</label>
    <input type="range" min="5" max="300" value="100"
           id="mid-sensitivity" />
    <span class="value">100%</span>
  </div>

  <div class="control-group">
    <label>High (Treble)</label>
    <input type="range" min="5" max="300" value="100"
           id="high-sensitivity" />
    <span class="value">100%</span>
  </div>
</div>
```

**Event Handling (UIService):**
```typescript
masterSlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  audioService.setMasterSensitivity(value);
  valueDisplay.textContent = `${value}%`;

  // Debounced save (500ms after user stops moving slider)
  this.debouncedSaveSensitivity();
});
```

## Edge Cases & Error Handling

### 1. Audio Clipping Detection
- Monitor scaled values
- If frequently exceeding 2.0-3.0, emit `audio:sensitivity-clipping` event
- UI shows visual indicator: "Sensitivity too high - clipping detected"

### 2. No Audio Input
- Zero audio values × any sensitivity = still zero
- UI sliders remain functional and adjustable

### 3. Rapid Slider Changes
- Debounce config saves (500ms after last change)
- Don't write to disk on every slider tick

### 4. Invalid Config Values
- Validate on load: check for negative, NaN, undefined
- Fall back to defaults if invalid: `{ master: 100, low: 100, mid: 100, high: 100 }`
- Log warning if fallback used

### 5. Value Clamping
- All setter methods clamp to [5, 300] range
- UI sliders have min/max attributes (5, 300)
- Double protection at API and UI level

## Testing Strategy

### Unit Tests (AudioService)
```typescript
describe('AudioService Sensitivity', () => {
  test('clamps sensitivity to 5-300 range');
  test('master sensitivity smooths over time');
  test('band sensitivities apply instantly');
  test('calculates scaled values correctly: bass × (low/100) × (master/100)');
  test('handles invalid config values gracefully');
  test('emits sensitivity-changed events');
  test('loads persisted sensitivities on init');
});
```

### Integration Tests
- Test UI slider → AudioService → scaled audio data flow
- Test config persistence: save → restart → load
- Test debounced saving (rapid slider changes)

### Manual Testing Scenarios
- **Quiet audio source:** Boost master to 200-300%, verify visuals respond
- **Loud audio source:** Reduce master to 20-50%, verify visuals calm down
- **Bass-heavy track:** Reduce low sensitivity, verify other frequencies still reactive
- **Rapid adjustments:** Move sliders quickly, verify smooth transitions (master) and instant changes (bands)

## Success Criteria

- ✅ Four sensitivity controls (master + 3 bands) functional
- ✅ Master sensitivity smooths over 200ms
- ✅ Band sensitivities apply instantly
- ✅ Values scale correctly: `final = raw × (band/100) × (master/100)`
- ✅ Minimum 5%, maximum 300% enforced
- ✅ Values persist between app sessions
- ✅ UI sliders update in real-time
- ✅ Config saves debounced (500ms)
- ✅ Scaled values can exceed 1.0 without breaking
- ✅ Invalid config values fall back to defaults

## Future Enhancements (Not in This Phase)

- MIDI/OSC control for sensitivity sliders
- Sensitivity automation/LFO modulation
- Per-preset sensitivity overrides
- Visual waveform showing scaled vs. raw audio
- Sensitivity presets (e.g., "Subtle", "Extreme", "Bass Focus")

## Implementation Notes

### Files to Modify
- `src/services/AudioService.ts` - Core implementation
- `src/services/UIService.ts` - UI controls
- `src/core/types.ts` - Type definitions for sensitivity config
- `electron/main.ts` - IPC handlers for config persistence
- `app-config.json` - Default configuration

### Dependencies
- No new dependencies required
- Uses existing: EventEmitter3, Electron IPC, config store

### Estimated Implementation Time
- AudioService changes: 2-3 hours
- UI integration: 1-2 hours
- Config persistence: 1 hour
- Testing: 1-2 hours
- **Total:** ~6-8 hours
