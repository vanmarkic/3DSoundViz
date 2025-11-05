// Particle vertex shader
uniform float uSize;
uniform float uTime;

attribute vec3 position;
attribute vec3 velocity;
attribute vec3 color;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = color;

  // Calculate alpha based on velocity (faster = brighter)
  float speed = length(velocity);
  vAlpha = clamp(speed * 2.0, 0.3, 1.0);

  // Position in world space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Point size with distance attenuation
  float distanceScale = 300.0 / -mvPosition.z;
  gl_PointSize = uSize * distanceScale;

  gl_Position = projectionMatrix * mvPosition;
}
