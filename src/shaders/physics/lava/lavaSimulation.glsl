// Lava simulation shader (updates velocity field)
uniform sampler2D uVelocityTexture;
uniform sampler2D uNoiseTexture;
uniform float uTime;
uniform float uViscosity;
uniform float uTemperature;
uniform float uTurbulence;
uniform float uDeltaTime;

varying vec2 vUv;

// 3D Simplex noise (simplified)
float snoise(vec3 v) {
  return fract(sin(dot(v, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec4 velocity = texture2D(uVelocityTexture, uv);

  // Sample noise for turbulence
  vec3 noisePos = vec3(uv * 5.0, uTime * 0.1);
  float noise = snoise(noisePos) * 2.0 - 1.0;

  // Apply turbulence
  velocity.xy += vec2(noise) * uTurbulence * uDeltaTime;

  // Apply viscosity (damping)
  velocity.xy *= (1.0 - uViscosity * 0.1);

  // Apply temperature (affects flow speed)
  velocity.xy *= (1.0 + uTemperature * 0.5);

  // Add convection (heat rises)
  velocity.y += uTemperature * 0.01;

  gl_FragColor = velocity;
}
