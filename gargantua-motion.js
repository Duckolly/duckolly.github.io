/* Gargantua Motion v5.
 * A lightweight WebGL2 animation of luminous disk filaments OVER the original
 * full-quality WebP. The original image is never hidden or rendered at reduced
 * resolution. No expensive geodesic tracing is performed in the default mode.
 * The legacy raytracer remains available through ?render=webgl.
 */
(() => {
  'use strict';

  if (new URLSearchParams(location.search).get('render') === 'webgl') return;

  const poster = document.querySelector('img.poster');
  if (!poster) return;

  const settings = window.__gargantuaMotion = {
    version: 5,
    mode: 'waiting',
    frames: 0,
    fps: 0,
    speed: 1.20,
    intensity: 1.35,
    resolutionScale: 1,
    imageWidth: 0,
    imageHeight: 0,
    errors: [],
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settings.mode = 'reduced-motion';
    return;
  }

  const VERTEX = `#version 300 es
  void main(){
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

  const FRAGMENT = `#version 300 es
  precision highp float;
  uniform sampler2D uPhoto;
  uniform vec2 uCanvas;
  uniform vec2 uImage;
  uniform float uTime;
  uniform float uStrength;
  out vec4 outColor;

  float sm(float lo, float hi, float x){
    return smoothstep(lo, hi, x);
  }

  // Gate the animation using the source image's OWN light and warm colours.
  // The original horizon, distant stars and black background stay untouched.
  float diskMaterial(vec3 c){
    float warm = sm(0.035, 0.38, c.r - c.b) * sm(0.055, 0.48, c.r);
    float hot = sm(0.58, 0.97, max(c.r, c.g)) *
                sm(-0.055, 0.19, c.r - c.b) * 0.36;
    return max(warm, hot);
  }

  void main(){
    vec2 screenUV = gl_FragCoord.xy / uCanvas;
    // Match CSS object-fit:contain (including letterbox/pillarbox regions).
    float fit = min(uCanvas.x / uImage.x, uCanvas.y / uImage.y);
    vec2 rect = uImage * fit / uCanvas;
    vec2 uv = (screenUV - 0.5 * (1.0 - rect)) / rect;
    if (any(lessThan(uv, vec2(0.0))) ||
        any(greaterThan(uv, vec2(1.0)))) {
      outColor = vec4(0.0);
      return;
    }

    vec3 photo = texture(uPhoto, uv).rgb;
    float material = diskMaterial(photo);
    // The disk is near the middle of the plate; these broad boundaries
    // exclude isolated stars without clipping its warped upper/lower arcs.
    float central = sm(0.03, 0.16, uv.x) * (1.0 - sm(0.84, 0.97, uv.x));
    central *= sm(0.05, 0.23, uv.y) * (1.0 - sm(0.84, 0.97, uv.y));
    float mask = material * central;
    if (mask < 0.005){ outColor = vec4(0.0); return; }

    // A projected rotating flow: one azimuthal field, a Kepler-like speed
    // falloff, and several trailing hot filaments. No full-frame camera
    // displacement, no zoom and no blur of the original WebP.
    vec2 center = vec2(0.50, 0.50);
    vec2 ellipse = vec2(0.52, 0.21);
    vec2 q = (uv - center) / ellipse;
    float r = length(q);
    float a = atan(q.y, q.x);
    float omega = 1.18 / (0.56 + 1.8 * r);
    float phase = a - uTime * omega;

    // Transport existing highlights around the projected disk. The sampling
    // changes illumination only; the original disk contour NEVER moves.
    vec2 rotating = center + ellipse * r * vec2(cos(phase), sin(phase));
    vec3 carried = texture(uPhoto, clamp(rotating, vec2(0.0), vec2(1.0))).rgb;
    float advected = diskMaterial(carried) * max(carried.r, carried.g * 0.85);

    // Fine filaments wind at different rates. The spatial frequencies are
    // deliberately moderate to avoid crawling aliasing on low-DPI screens.
    float spiral = a * 14.0 + r * 17.0 - uTime * (1.6 * omega);
    float f1 = sin(spiral + 0.32 * sin(r * 13.0));
    float f2 = sin(spiral * 1.87 - r * 8.0 + 1.4);
    float f3 = sin(a * 5.0 + r * 31.0 - uTime * omega * 2.5);
    float filaments = sm(-0.02, 0.86, 0.63 * f1 + 0.25 * f2 + 0.12 * f3);

    float luma = dot(photo, vec3(0.2126, 0.7152, 0.0722));
    float flux = (0.16 + 0.53 * advected + 0.42 * filaments) *
                 (0.23 + 0.77 * sm(0.03, 0.68, luma));
    flux *= mask * clamp(uStrength, 0.0, 2.0);

    // Screen compositing guarantees every original pixel remains visible.
    // Transparent outside the photographed disk; no static image replacement.
    vec3 emission = vec3(1.00, 0.52, 0.22) * clamp(flux, 0.0, 0.66);
    outColor = vec4(emission, clamp(flux * 1.15, 0.0, 0.63));
  }`;

  function fail(reason){
    settings.mode = 'fallback-webp';
    settings.errors.push(String(reason));
    console.warn('[Gargantua motion] WebP fallback:', reason);
  }

  function shader(gl, type, source){
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(s) || 'Shader compilation error';
      gl.deleteShader(s);
      throw new Error(message);
    }
    return s;
  }

  async function start(){
    try {
      if (!poster.complete) {
        await new Promise((resolve, reject) => {
          poster.addEventListener('load', resolve, {once:true});
          poster.addEventListener('error', reject, {once:true});
        });
      }
      if (poster.decode) await poster.decode();
      if (!poster.naturalWidth || !poster.naturalHeight) {
        throw new Error('WebP image did not load');
      }
      settings.imageWidth = poster.naturalWidth;
      settings.imageHeight = poster.naturalHeight;
      document.body.dataset.gargantuaMode = 'animated-webp';

      const canvas = document.createElement('canvas');
      canvas.id = 'gargantua-motion';
      canvas.className = 'gargantua-motion';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);

      const gl = canvas.getContext('webgl2', {
        alpha:true, premultipliedAlpha:false,
        antialias:false, depth:false, stencil:false,
        preserveDrawingBuffer:false, powerPreference:'low-power'
      });
      if (!gl){ canvas.remove(); fail('WebGL2 unavailable'); return; }

      let raf = 0;
      let active = true;
      let last = -1000;
      let sampleStart = 0;
      let sampleFrames = 0;
      let startClock = 0;
      const stop = () => { active=false; cancelAnimationFrame(raf); };
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        stop();
        canvas.style.display='none';
        fail('WebGL context lost');
      });
      canvas.addEventListener('webglcontextrestored', () => {
        canvas.remove();
        void start();
      }, { once:true });

      try {
        const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
        const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program) || 'Program linking error');
        }
        gl.useProgram(program);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const uniforms = {
          photo:gl.getUniformLocation(program,'uPhoto'),
          canvas:gl.getUniformLocation(program,'uCanvas'),
          image:gl.getUniformLocation(program,'uImage'),
          time:gl.getUniformLocation(program,'uTime'),
          strength:gl.getUniformLocation(program,'uStrength'),
        };
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('WebP GPU upload failed');
        gl.uniform1i(uniforms.photo, 0);
        gl.uniform2f(uniforms.image, poster.naturalWidth, poster.naturalHeight);

        function resize(){
          // Render ONLY moving light, never the base image. A capped internal
          // resolution cannot lower WebP sharpness, unlike the old raytracer.
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const maxPixels = 2_300_000;
          const w = Math.max(1, window.innerWidth);
          const h = Math.max(1, window.innerHeight);
          const cap = Math.min(1, Math.sqrt(maxPixels / (w * h * dpr * dpr)));
          const scale = dpr * cap;
          canvas.width = Math.max(2, Math.round(w * scale));
          canvas.height = Math.max(2, Math.round(h * scale));
          settings.resolutionScale = scale;
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.uniform2f(uniforms.canvas, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize, {passive:true});
        settings.mode = 'animated-webp';

        function render(now){
          if (!active) return;
          raf = requestAnimationFrame(render);
          if (document.hidden) return;
          if (window.frameElement && !window.frameElement.getClientRects().length) return;
          // 30fps is enough for plasma motion, leaving the CPU/GPU available
          // for the portfolio. No degrading image quality after a few seconds.
          if (now - last < 1000 / 30 - 2) return;
          last = now;
          if (!startClock) startClock = now;
          gl.useProgram(program);
          gl.bindVertexArray(vao);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform1f(uniforms.time, ((now - startClock) / 1000) * Math.max(0, settings.speed));
          gl.uniform1f(uniforms.strength, settings.intensity);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          settings.frames++;
          sampleFrames++;
          if (!sampleStart) sampleStart = now;
          if (now - sampleStart > 1000) {
            settings.fps = Math.round(sampleFrames * 1000 / (now - sampleStart));
            sampleFrames=0;sampleStart=now;
          }
        }
        raf = requestAnimationFrame(render);
      } catch(error) {
        stop();
        canvas.remove();
        fail(error?.message || error);
      }
    } catch(error) {
      fail(error?.message || error);
    }
  }

  void start();
})();
