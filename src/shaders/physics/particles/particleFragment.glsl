// Particle fragment shader
uniform float uGlow;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Circular point sprite
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft edges
  float alpha = smoothstep(0.5, 0.3, dist) * vAlpha;

  // Glow effect
  vec3 finalColor = vColor;
  if (uGlow > 0.0) {
    finalColor += vColor * uGlow * (1.0 - dist * 2.0);
  }

  gl_FragColor = vec4(finalColor, alpha);
}
