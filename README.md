# AutoVJ - Production-Ready Audio Visual Application

A full-featured, production-ready auto VJ solution with constructivist/deconstructivist aesthetics. Built with TypeScript, Three.js, and Web Audio API.

## 🎨 Features

### Core Features
- **Real-time Audio Analysis**: Advanced FFT analysis with multichannel support (stereo, 5.1, 7.1, custom)
- **10 Controllable Parameters**: Live tweaking and automation
- **LFO Modulation System**: Synced (tempo-locked) and free (Hz-based) oscillators with multiple waveforms
- **Audio-Reactive Automation**: Map any audio feature to any parameter
- **Constructivist/Deconstructivist Aesthetics**: Dynamic geometric scenes with bold colors and forms
- **Optimized Rendering**: GPU-accelerated Three.js with instanced rendering
- **Performance Monitoring**: Real-time FPS, draw calls, and resource tracking
- **Preset System**: Save and recall complete parameter states
- **Video Output Configuration**: Resolution, quality, and codec settings

### 10 VJ Parameters
1. **Complexity** (0-1): Geometry detail, particle count
2. **Scale** (0-1): Object size, zoom level
3. **Rotation Speed** (0-1): Animation speed
4. **Fragmentation** (0-1): Deconstruction level
5. **Color Intensity** (0-1): Saturation, brightness
6. **Contrast** (0-1): Light/dark ratio
7. **Asymmetry** (0-1): Balance vs. chaos
8. **Depth** (0-1): Z-space usage
9. **Motion Blur** (0-1): Trail length
10. **Glitch Amount** (0-1): Digital artifacts

### Audio Features
- Multi-channel input support
- Frequency band analysis (bass, low-mid, mid, high-mid, treble)
- Beat detection (kick, snare, hi-hat)
- RMS and peak level monitoring
- Spectral analysis (centroid, flux, rolloff)
- Configurable FFT size (512-8192)

### Visual Features
- Three aesthetic modes: Constructivist, Deconstructivist, Mixed
- Dynamic geometry generation
- Bold color palettes (red, black, white, yellow, blue)
- GPU-optimized rendering
- Responsive design
- Real-time parameter updates

## 🏗️ Architecture

### Service-Based Design
- **AudioService**: Audio input, analysis, and feature extraction
- **ParameterService**: Central parameter management and automation
- **LFOService**: Low-frequency oscillator modulation
- **RenderEngine**: Optimized WebGL rendering with Three.js
- **VisualService**: Scene generation and management
- **UIService**: User interface for parameter control
- **EventBus**: Centralized event communication

### Technology Stack
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Three.js**: 3D rendering engine
- **Web Audio API**: Real-time audio processing
- **EventEmitter3**: High-performance event system
- **Stats.js**: Performance monitoring
- **Electron** (optional): Desktop app packaging

## 📂 Project Structure

```
3DSoundViz/
├── src/
│   ├── core/               # Core infrastructure
│   │   ├── types.ts        # TypeScript definitions
│   │   ├── EventBus.ts     # Event system
│   │   └── ServiceContainer.ts
│   ├── services/           # Service layer
│   │   ├── AudioService.ts
│   │   ├── ParameterService.ts
│   │   ├── LFOService.ts
│   │   ├── RenderEngine.ts
│   │   ├── VisualService.ts
│   │   └── UIService.ts
│   ├── visuals/            # Visual generators
│   ├── shaders/            # GLSL shaders
│   ├── audio/              # Audio processors
│   ├── ui/                 # UI components
│   └── main.ts             # Application entry point
├── electron/               # Electron app (optional)
│   ├── main.ts
│   └── preload.ts
├── assets/                 # Static assets
├── index.html              # Entry HTML
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── ARCHITECTURE.md         # Detailed architecture docs
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Modern browser with Web Audio API support
- Microphone or audio input device

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 3DSoundViz
```

2. **Install dependencies**
```bash
npm install --omit=optional  # For browser-only mode
# OR
npm install                   # For full Electron support
```

### Development

**Browser Mode (Recommended for development)**
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

**Electron Mode**
```bash
npm run dev:electron
```

### Building

**Browser Build**
```bash
npm run build
npm run preview  # Preview production build
```

**Electron Build**
```bash
npm run build:electron
```

## 🎮 Usage

### Controls

#### Keyboard Shortcuts
- `H` - Toggle UI visibility
- `R` - Reset all parameters to defaults
- `1-9` - Quick presets

#### Parameter Control
- **Sliders**: Drag to adjust parameter values
- **Double-click slider**: Reset to default value
- **Live feedback**: Values update in real-time

### Audio Setup

1. Click "Allow Microphone Access" when prompted
2. Select your audio input device
3. Audio analysis starts automatically
4. Adjust parameters to taste

### Creating Automations

**Audio-Reactive**
```typescript
// Map bass frequency to scale parameter
parameterService.setAutomation({
  parameter: 'scale',
  source: 'audio:bass',
  amount: 0.5,
  range: [0.3, 1.0],
  curve: 'exponential'
})
```

**LFO Modulation**
```typescript
// Create synced sine LFO for rotation
lfoService.createLFO({
  waveform: 'sine',
  mode: 'synced',
  division: '1/4',
  amplitude: 0.3,
  offset: 0.5,
  enabled: true
})
```

## 🎨 Visual Aesthetics

### Constructivist Mode
- Grid-based layouts
- Geometric primitives (cubes, cylinders, spheres)
- Bold primary colors
- Ordered, balanced compositions
- Flat shading for geometric look

### Deconstructivist Mode
- Scattered, asymmetric positioning
- Fragmented forms
- Wireframe elements
- Chaotic, broken grids
- Dynamic movement

### Mixed Mode
- Combination of both aesthetics
- Balanced chaos
- Transitional states

## 🔧 Configuration

### Audio Configuration
Edit in `src/main.ts`:
```typescript
audioService.initialize({
  deviceId: 'default',
  channelCount: 2,      // 2, 4, 6, 8, etc.
  sampleRate: 48000,
  fftSize: 2048,        // 512, 1024, 2048, 4096, 8192
  smoothingTimeConstant: 0.8
})
```

### Render Configuration
```typescript
renderEngine.initialize(canvas, {
  width: 1920,
  height: 1080,
  pixelRatio: 2,
  antialias: true,
  quality: 'high',      // 'low', 'medium', 'high', 'ultra'
  targetFPS: 60
})
```

### Visual Configuration
```typescript
visualService.setAesthetic('constructivist')  // or 'deconstructivist', 'mixed'
visualService.setColorPalette(['#FF0000', '#000000', '#FFFFFF'])
```

## 📊 Performance Optimization

### Implemented Optimizations
- **GPU Instancing**: Shared geometry for repeated objects
- **Custom Shaders**: Move computation to GPU
- **Object Pooling**: Reuse geometry and materials
- **Adaptive Quality**: Dynamic LOD based on FPS
- **Efficient Audio Analysis**: Optimized FFT processing

### Performance Tips
1. Reduce complexity parameter for more objects
2. Lower FFT size for faster analysis (512-1024)
3. Use 'medium' or 'low' quality on slower hardware
4. Disable anti-aliasing if needed
5. Close DevTools in production

### Target Performance
- **60 FPS** @ 1080p on mid-range GPU
- **< 100ms** audio latency
- **< 5%** CPU usage for audio analysis
- **< 500MB** RAM usage

## 🔮 Future Enhancements

### Planned Features
- [ ] MIDI input support
- [ ] OSC protocol integration
- [ ] Video output via Syphon/Spout/NDI
- [ ] Recording functionality
- [ ] More visual presets
- [ ] Shader hot-reloading
- [ ] WebAssembly audio processing
- [ ] Advanced beat detection
- [ ] Multi-screen output
- [ ] Plugin system

### WebAssembly Integration (Planned)
For performance-critical operations:
- High-resolution FFT analysis
- Advanced beat detection algorithms
- Real-time DSP effects
- Perlin noise generation

## 🐛 Troubleshooting

### Audio Not Working
- Check microphone permissions
- Verify audio device is selected
- Try a different browser (Chrome/Edge recommended)
- Check browser console for errors

### Low FPS
- Reduce complexity parameter
- Lower render quality
- Disable anti-aliasing
- Close other applications
- Update graphics drivers

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js 18+ is installed
- Check for TypeScript errors with `npm run typecheck`

### Electron Issues
- Electron downloads may fail in restricted networks
- Use browser mode as alternative: `npm run dev`
- Install Electron separately if needed

## 📝 Development

### Code Style
- TypeScript strict mode (configurable)
- ESLint for linting (optional)
- Path aliases for imports (`@services`, `@core`, etc.)
- Event-driven architecture
- Service-oriented design

### Adding New Parameters
1. Add to `ParameterName` type in `src/core/types.ts`
2. Update `ParameterValues` interface
3. Initialize in `ParameterService.initialize()`
4. Use in `VisualService.update()`

### Adding New Visual Effects
1. Create new method in `VisualService`
2. Generate geometry and materials
3. Apply parameter-driven transformations
4. Add to scene

### Testing
```bash
npm run typecheck  # TypeScript validation
npm run lint       # ESLint (if configured)
```

## 📄 License

ISC

## 🙏 Acknowledgments

- Three.js for 3D rendering
- Web Audio API for audio processing
- Vite for blazing-fast builds
- Electron for desktop packaging
- Stats.js for performance monitoring

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for VJs and visual artists**
