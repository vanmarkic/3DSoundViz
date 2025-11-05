# Audio-Reactive Lighting Control System

## Overview

The lighting system now supports **LFO-controlled dynamic movement** with subtle, smooth transitions perfect for live VJ performances. You can control light position, orbit, speed, and intensity using the existing LFO modulation system.

## Features

### Light Properties

Each of the three lights (Main, Fill, Rim) has the following configurable properties:

1. **Position (X, Y, Z)** - Base position in 3D space
2. **Orbit Radius** - How far the light moves from its base position (0-10)
3. **Speed** - Movement speed multiplier (0-5)
4. **Intensity** - Light brightness (0-2)
5. **Pattern** - Movement pattern:
   - `circle` - Circular orbit in XZ plane
   - `figure8` - Figure-8 pattern
   - `linear` - Linear back-and-forth
   - `none` - Static, no movement

### Movement Patterns

**Circle Pattern**:
- Lights orbit in a circular path around their base position
- Creates smooth, predictable movement
- Great for subtle ambient effects

**Figure-8 Pattern**:
- Creates a figure-8 motion path
- More dynamic than circular
- Good for visual interest without chaos

**Linear Pattern**:
- Simple back-and-forth movement
- Clean and minimal
- Works well synced to beat

**None**:
- Lights stay at base position
- Use when you want static lighting

## Using LFO Modulation

### Setting Up Beat-Synced Light Movement

To make a light move in sync with the beat at a slow pace (4/1 or 8/1):

1. **Create an LFO** in the UI (already have 2 default ones)
2. **Configure the LFO**:
   - Waveform: `sine` (smooth movement)
   - Mode: `synced` (beat-locked)
   - Division: `4/1` or `2/1` (slow, 4 or 2 bars per cycle)
   - Amplitude: `0.3-0.5` (subtle modulation)
   - Offset: `0.5` (centered)
3. **Target**: Select a light property:
   - `Main Light → Speed` - Modulate main light movement speed
   - `Fill Light → Orbit Radius` - Modulate fill light orbit size
   - `Rim Light → Intensity` - Modulate rim light brightness

### Example Setups

**Slow pulsing main light** (4 bars per cycle):
```
LFO 1:
  Waveform: sine
  Mode: synced
  Division: 4/1
  Amplitude: 0.4
  Offset: 0.5
  Target: Main Light → Speed
  Mod Amount: 0.6
```

**Breathing orbit effect**:
```
LFO 2:
  Waveform: sine
  Mode: synced
  Division: 2/1
  Amplitude: 0.3
  Offset: 0.5
  Target: Fill Light → Orbit Radius
  Mod Amount: 0.5
```

**Intensity flutter on beats**:
```
LFO 3:
  Waveform: triangle
  Mode: synced
  Division: 1/1 (every bar)
  Amplitude: 0.2
  Offset: 0.8
  Target: Rim Light → Intensity
  Mod Amount: 0.4
```

## Default Light Configuration

### Main Light
- Base Position: `[5, 10, 7]`
- Orbit Radius: `5`
- Speed: `1.0`
- Intensity: `1.0`
- Pattern: `circle`
- Color: White (`0xffffff`)

### Fill Light
- Base Position: `[-5, 0, -5]`
- Orbit Radius: `3`
- Speed: `0.8`
- Intensity: `0.3`
- Pattern: `circle`
- Color: Cool blue (`0x4080ff`)

### Rim Light
- Base Position: `[0, -5, -10]`
- Orbit Radius: `4`
- Speed: `1.2`
- Intensity: `0.4`
- Pattern: `circle`
- Color: Warm orange (`0xff8040`)

## Technical Details

### Architecture

**VisualService** manages the lights:
- Stores light configurations
- Updates light positions based on patterns
- Exposes `getLightConfig()` and `setLightProperty()` methods

**LFOService** modulates light properties:
- Recognizes `light:{name}:{property}` targets
- Applies smooth LFO modulation to light values
- Respects modulation amount for subtle control

**UIService** provides control interface:
- LFO target selector includes all light properties
- Organized by light type for easy navigation

### Events

Light changes emit events via EventBus:
- `light:changed` - When a property value changes
- `light:config-updated` - When entire configuration updates

### Performance

- Lights update every frame (smooth 60fps movement)
- Smooth lerp interpolation prevents jitter
- Minimal CPU overhead (lights are standard Three.js objects)

## Best Practices

### For Live Performance

1. **Start subtle** - Use low amplitudes (0.2-0.4) and slow divisions (4/1, 2/1)
2. **Test patterns** - Try different movement patterns to see what fits your aesthetic
3. **Layer modulation** - Use multiple LFOs on different lights for complexity
4. **Sync to tempo** - Always use synced mode for beat-locked movement
5. **Save presets** - Once you find a good setup, save it!

### Combining with Audio

Light modulation works **alongside** your existing audio-reactive parameters:
- Geometry reacts to bass/mids/treble
- Lights provide ambient movement
- Together they create a cohesive audiovisual experience

### Modulation Ranges

The system automatically maps LFO values (0-1) to appropriate ranges:
- **Position X/Y/Z**: ±10 units from base
- **Orbit Radius**: 0-10 units
- **Speed**: 0-5x multiplier
- **Intensity**: 0-2x brightness

## Troubleshooting

**Lights not moving?**
- Check that the LFO is enabled (checkbox in UI)
- Verify the target is set to a light property
- Ensure modulation amount > 0

**Movement too fast/slow?**
- Adjust the LFO division (higher = slower, lower = faster)
- For synced mode: 4/1 is very slow, 1/4 is faster
- Or directly modulate the light's speed property

**Lights too dim/bright?**
- Adjust the intensity property directly
- Or use an LFO to modulate intensity dynamically

**Patterns not visible?**
- Increase orbit radius for larger movement
- Try different patterns (figure8 is more noticeable than circle)

## Future Enhancements

Possible additions:
- Direct UI sliders for light properties (not just LFO)
- More movement patterns (spiral, random walk, etc.)
- Color modulation support
- Light presets separate from full app presets
- Shadow casting for dramatic effects
