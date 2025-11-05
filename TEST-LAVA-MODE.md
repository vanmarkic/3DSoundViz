# Lava Mode Testing Instructions

## How to Test Mode Switching

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the browser console** (F12 or Cmd+Option+I)

3. **Wait for the app to initialize** - you should see:
   ```
   PhysicsService initialized in mode: particles
   ```

4. **Test mode switching to lava:**
   ```javascript
   // Get the physics service from the container
   const physicsService = container.get('physicsService')

   // Check current mode
   console.log('Current mode:', physicsService.getMode())
   // Should output: "particles"

   // Switch to lava mode
   physicsService.setMode('lava', 0)

   // Verify the switch
   console.log('New mode:', physicsService.getMode())
   // Should output: "lava"

   // Check mode parameters
   console.log('Lava parameters:', physicsService.getModeParameters())
   // Should output: ["viscosity", "temperature", "scale", "flowSpeed", "turbulence", "colorIntensity", "contrast", "depth", "distortion"]
   ```

5. **Expected console output:**
   ```
   PhysicsService switched to mode: lava
   LavaMode initialized
   ```

6. **Test parameter setting:**
   ```javascript
   // Set lava temperature
   physicsService.setParameter('temperature', 0.8)

   // Get parameter value
   console.log('Temperature:', physicsService.getParameter('temperature'))
   // Should output: 0.8
   ```

7. **Switch back to particles:**
   ```javascript
   physicsService.setMode('particles', 0)
   console.log('Back to:', physicsService.getMode())
   // Should output: "particles"
   ```

## Expected Visual Behavior

### Particles Mode
- You should see particles floating in space
- Particles have different colors (red, black, white, gold, blue)
- Particles attract to center and respond to gravity

### Lava Mode
- You should see a large plane/surface (lava lake)
- The surface should be displaced based on simulation
- Colors should range from dark red to orange to yellow-white
- The lava should appear to flow and have heat-based coloring

## Troubleshooting

If mode switching doesn't work:
1. Check browser console for errors
2. Verify TypeScript compilation: `npx tsc --noEmit`
3. Rebuild: `npm run build`
4. Check that all shader files exist in `src/shaders/physics/lava/`
5. Verify LavaMode is imported in PhysicsService.ts

## Implementation Details

Files created:
- `/src/shaders/physics/lava/lavaSimulation.glsl` - Velocity field simulation
- `/src/shaders/physics/lava/lavaVertex.glsl` - Surface vertex displacement
- `/src/shaders/physics/lava/lavaFragment.glsl` - Heat-based coloring
- `/src/physics/modes/LavaMode.ts` - Lava physics mode implementation

Files modified:
- `/src/services/PhysicsService.ts` - Added LavaMode registration
- `/src/main.ts` - Exposed container for testing

## Parameters

Lava mode parameters (all normalized 0-1):
- `viscosity` (0.5) - How thick/slow the lava flows
- `temperature` (0.7) - Heat level (affects color and flow)
- `scale` (0.5) - Size of the lava surface
- `flowSpeed` (0.5) - Speed of lava movement
- `turbulence` (0.3) - Amount of chaotic movement
- `colorIntensity` (1.0) - Brightness of colors
- `contrast` (0.6) - Contrast between hot and cool areas
- `depth` (0.4) - Amount of surface displacement
- `distortion` (0.5) - Visual distortion amount
