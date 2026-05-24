uniform sampler2D tDiffuse;
uniform int u_type;
uniform float scroll_pow;
uniform float modeChangePow;
uniform float mode;
uniform float device;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  if (u_type == 1) {
    vec2 uvTwist = uv;
    float angleX = (uv.x - 0.5) * 3.14159 * 0.9;
    uvTwist.y -= tan(angleX) * 0.15;

    vec2 uvTwist2 = uv;
    float angleX2 = (uv.x - 0.5) * 3.14159;
    float blend = smoothstep(0.2, 0.8, uv.x);
    uvTwist2.y += tan(angleX2) * -0.002 * (1. - blend);
    uvTwist2.y -= tan(angleX2) * -0.002 * blend;

    vec2 uvDepth2 = uv;
    float edgeInfluenceX2 = smoothstep(0.0, 0.2, uv.x) - smoothstep(0.8, 1.0, uv.x);
    uvDepth2.y -= (edgeInfluenceX2 - 1.0) * .025;

    vec2 uvWave2 = uv;

    vec2 powEffect = mix(uvWave2, uvTwist, scroll_pow * 0.5);
    vec2 modeChange = mix(powEffect, uvWave2, mode);
    vec2 modeEffect2 = mix(uvDepth2, uvTwist, 0.5);
    vec2 transitionEffect = mix(modeChange, modeEffect2, modeChangePow);

    vec2 deviceOriginal = mix(uvTwist2, uvTwist, .0);
    vec2 deviceEffect = mix(modeChange, deviceOriginal, device);
    vec2 finalUV = mix(deviceEffect, transitionEffect, modeChangePow);

    float edgeDarkness = smoothstep(0.3, 0., uv.x) + smoothstep(0.7, 1., uv.x);
    edgeDarkness = clamp(edgeDarkness, 0.0, 1.0);
    vec4 baseColor = texture2D(tDiffuse, finalUV);
    vec4 darkenedColor = baseColor * (1.0 - edgeDarkness * 0.8);

    gl_FragColor = mix(baseColor, darkenedColor, mode);
  }
}
