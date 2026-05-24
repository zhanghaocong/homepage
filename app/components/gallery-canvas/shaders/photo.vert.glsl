varying vec2 vUv;
uniform int u_type;
uniform float pw;
const float curvePower = 5.0;

void main() {
  vUv = uv;
  if (u_type == 1) {
    float normalizedX = position.x / 1.0;
    float tz = pw * curvePower * normalizedX;
    vec3 newPosition = vec3(position.x, position.y, tz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
}
