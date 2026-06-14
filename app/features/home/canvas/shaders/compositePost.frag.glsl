uniform int u_type;
uniform float scroll_pow;
uniform float modeChangePow;
uniform float mode;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (u_type == 1) {
    // 90° CCW: twist/depth driven by uv.y, displacement applied on uv.x.
    vec2 uvTwist = uv;
    float angleY = (uv.y - 0.5) * 3.14159 * 0.9;
    uvTwist.x -= tan(angleY) * 0.15;

    vec2 uvDepth2 = uv;
    float edgeInfluenceY2 = smoothstep(0.0, 0.2, uv.y) - smoothstep(0.8, 1.0, uv.y);
    uvDepth2.x -= (edgeInfluenceY2 - 1.0) * .025;

    vec2 uvWave2 = uv;

    vec2 powEffect = mix(uvWave2, uvTwist, scroll_pow * 0.5);
    vec2 modeChange = mix(powEffect, uvWave2, mode);
    vec2 modeEffect2 = mix(uvDepth2, uvTwist, 0.5);
    vec2 transitionEffect = mix(modeChange, modeEffect2, modeChangePow);

    // All viewports share the same scroll-driven twist; an earlier mobile-only
    // path injected an unbounded tan((uv.y-0.5)*pi) that tore the top/bottom
    // edges and stayed on at rest, so it was removed.
    vec2 finalUV = mix(modeChange, transitionEffect, modeChangePow);

    float edgeDarkness = smoothstep(0.3, 0., uv.y) + smoothstep(0.7, 1., uv.y);
    edgeDarkness = clamp(edgeDarkness, 0.0, 1.0);
    vec4 baseColor = texture2D(inputBuffer, finalUV);
    vec4 darkenedColor = baseColor * (1.0 - edgeDarkness * 0.8);

    outputColor = mix(baseColor, darkenedColor, mode);
  } else {
    outputColor = inputColor;
  }
}
