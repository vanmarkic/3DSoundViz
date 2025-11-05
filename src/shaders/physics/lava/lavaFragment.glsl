// Lava surface fragment shader
uniform float uTemperature;
uniform float uColorIntensity;
uniform float uContrast;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;

void main() {
  // Base lava color (red-orange-yellow gradient)
  vec3 coolColor = vec3(0.3, 0.0, 0.0); // Dark red
  vec3 hotColor = vec3(1.0, 0.6, 0.0);  // Orange
  vec3 veryHotColor = vec3(1.0, 1.0, 0.3); // Yellow-white

  // Mix based on temperature and displacement
  float heat = (uTemperature + vDisplacement) * 0.5;
  vec3 color = mix(coolColor, hotColor, heat);
  color = mix(color, veryHotColor, max(0.0, heat - 0.5) * 2.0);

  // Apply color intensity
  color *= uColorIntensity;

  // Apply contrast (darken cracks)
  float crack = smoothstep(0.3, 0.5, vDisplacement);
  color *= mix(0.2, 1.0, crack * uContrast);

  // Glow effect
  float glow = pow(heat, 2.0);
  color += vec3(glow * 0.5);

  gl_FragColor = vec4(color, 1.0);
}
