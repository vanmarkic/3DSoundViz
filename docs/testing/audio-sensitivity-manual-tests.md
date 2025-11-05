# Audio Sensitivity - Manual Testing Checklist

## Setup
- [ ] Build app: `npm run build`
- [ ] Run app: `npm run dev:electron`
- [ ] Allow microphone access
- [ ] Play audio (music, white noise, etc.)

## Basic Functionality
- [ ] UI panel visible in top-right corner
- [ ] All 4 sliders present (Master, Low, Mid, High)
- [ ] Slider values display correctly (5-300%)
- [ ] Console shows audio levels updating

## Master Sensitivity
- [ ] Set Master to 50% → visuals less reactive
- [ ] Set Master to 200% → visuals more reactive
- [ ] Changes feel smooth (200ms interpolation)
- [ ] Value persists after app restart

## Low Sensitivity (Bass)
- [ ] Set Low to 50% while playing bass-heavy track
- [ ] Bass-driven parameters less reactive
- [ ] Mid/high frequencies unaffected
- [ ] Changes apply instantly (no smoothing)
- [ ] Value persists after app restart

## Mid Sensitivity
- [ ] Set Mid to 50% while playing mid-heavy track
- [ ] Mid-driven parameters less reactive
- [ ] Low/high frequencies unaffected
- [ ] Changes apply instantly
- [ ] Value persists after app restart

## High Sensitivity (Treble)
- [ ] Set High to 50% while playing treble-heavy track
- [ ] Treble-driven parameters less reactive
- [ ] Low/mid frequencies unaffected
- [ ] Changes apply instantly
- [ ] Value persists after app restart

## Combined Settings
- [ ] Master=50%, Low=200% → bass boosted but overall calm
- [ ] Master=200%, Low=50% → overall energetic but bass subdued
- [ ] Master=100%, Low=300%, Mid=50%, High=50% → bass-focused

## Edge Cases
- [ ] Set all to minimum (5%) → visuals still responsive
- [ ] Set all to maximum (300%) → no crashes, values clamp
- [ ] Rapid slider movements → no UI lag or crashes
- [ ] No audio input → sliders still adjustable

## Persistence
- [ ] Change all 4 values
- [ ] Wait 1 second (debounce)
- [ ] Restart app
- [ ] All values load correctly

## Console Output
- [ ] No errors in console
- [ ] "Sensitivity saved to config" appears after changes
- [ ] Audio levels log every second
- [ ] Build completes without errors
