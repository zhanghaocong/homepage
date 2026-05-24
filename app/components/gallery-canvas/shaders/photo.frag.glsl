varying vec2 vUv;
uniform sampler2D tA;
uniform vec2 vUvScale;
uniform vec4 vUvRect;
uniform float opacityN;
uniform float mode;

void main() {
  vec2 uv = (vUv - 0.5) * vUvScale + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; }

  vec2 atlasUv = mix(vUvRect.xy, vUvRect.zw, uv);
  vec4 color = texture2D(tA, atlasUv);
  float gray = (color.r + color.g + color.b) / 3.0;
  vec4 gridColor = mix(vec4(gray, gray, gray, opacityN), color, 1.0 - opacityN);

  vec4 colorD = texture2D(tA, atlasUv);
  colorD.rgb += 0.01;
  vec4 colorC = texture2D(tA, atlasUv);
  colorC.rgb += 0.05;
  vec4 fullColor = mix(colorC, colorD, mode);

  gl_FragColor = mix(gridColor, fullColor, mode);
}
