// Lava surface vertex shader
uniform sampler2D uDisplacementMap;
uniform float uDepth;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;

void main() {
  vUv = uv;
  vNormal = normal;

  // Sample displacement
  vec4 displacement = texture2D(uDisplacementMap, uv);
  vDisplacement = displacement.r;

  // Apply depth displacement
  vec3 newPosition = position + normal * displacement.r * uDepth * 2.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
