/**
 * Gargantua-inspired interactive hero, v2.0.
 * Standalone WebGL2 + GLSL, no bundler/CDN/backend; GitHub Pages compatible.
 * Ray bending is a stylized Schwarzschild-inspired approximation, NOT a Kerr geodesic solver.
 * Everything linked is HTML so links still work without WebGL or JavaScript animation.
 */
(() => {
  'use strict';

  const card = document.querySelector('#page-home .hero-art');
  if (!card || card.dataset.cosmicInitialized === '1') return;
  card.dataset.cosmicInitialized = '1';

  const links = [
    { route: 'home', number: '01', title: 'Главная', css: 'cosmic-home' },
    { route: 'ai-projects', number: '02', title: 'AI-проекты', css: 'cosmic-projects' },
    { route: 'experience', number: '03', title: 'Кейсы', css: 'cosmic-cases' },
    { route: 'skills', number: '04', title: 'Стек', css: 'cosmic-skills' },
    { route: 'contacts', number: '05', title: 'Связаться', css: 'cosmic-contact' }
  ];

  const canvas = document.createElement('canvas');
  canvas.className = 'cosmic-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  // A locally generated frame from the same bending algorithm; never a film asset.
  const fallback = document.createElement('div');
  fallback.className = 'cosmic-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  const fallbackImage = document.createElement('img');
  fallbackImage.src = './gargantua-fallback.webp';
  fallbackImage.alt = '';
  fallbackImage.loading = 'eager';
  fallbackImage.decoding = 'async';
  fallback.append(fallbackImage);

  const orbitLines = document.createElement('div');
  orbitLines.className = 'cosmic-orbits';
  orbitLines.setAttribute('aria-hidden', 'true');
  orbitLines.append(document.createElement('i'), document.createElement('i'));

  const nav = document.createElement('nav');
  nav.className = 'cosmic-nav';
  nav.setAttribute('aria-label', 'Интерактивная навигация по разделам');
  for (const entry of links) {
    const a = document.createElement('a');
    a.href = `#${entry.route}`;
    a.className = `cosmic-link ${entry.css}`;
    a.setAttribute('aria-label', entry.title);
    a.title = entry.title;
    const number = document.createElement('span');
    number.className = 'cosmic-link-number';
    number.textContent = entry.number;
    const label = document.createElement('span');
    label.className = 'cosmic-link-label';
    label.textContent = entry.title;
    a.append(number, label);
    nav.append(a);
  }

  const motionToggle = document.createElement('button');
  motionToggle.type = 'button';
  motionToggle.className = 'cosmic-motion-toggle';
  motionToggle.setAttribute('aria-pressed', 'false');

  card.prepend(fallback, canvas, orbitLines);
  card.append(nav, motionToggle);
  card.classList.add('cosmic-active');
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', 'Космическая навигация с чёрной дырой');

  const vertexShader = `#version 300 es
    in vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;
    uniform float u_speed;
    out vec4 fragColor;

    float hash21(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 43.19);
      return fract(p.x * p.y);
    }
    float bell(float v, float sigma) {
      float x = v / sigma;
      return exp(-x * x);
    }
    float starfield(vec2 p, float density, float threshold) {
      vec2 cell = floor(p * density);
      vec2 local = fract(p * density) - 0.5;
      float h = hash21(cell);
      float shape = 1.0 - smoothstep(0.008, 0.068, length(local));
      return step(threshold, h) * shape * (0.3 + h * 0.7);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
      vec3 camera = vec3(u_pointer.x * 0.12, 1.12 + u_pointer.y * 0.20, 7.50);
      vec3 forward = normalize(-camera);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 direction = normalize(forward * 2.7 + right * (uv.x * 3.6) + up * (uv.y * 3.6));
      vec3 position = camera;
      float impact = length(cross(position, direction));

      vec3 diskColor = vec3(0.0);
      float opacity = 0.0;
      bool captured = false;

      // Curved ray propagation towards a dark event-horizon surrogate.
      // Integrates a projected inverse-square attraction along the ray.
      // Produces lensed primary and secondary images of the accretion plane.
      if (impact < 4.70) {
        for (int i = 0; i < 112; i++) {
          float radius = length(position);
          if (radius < 0.72) { captured = true; break; }

          float ds = clamp(radius * 0.057 * u_speed, 0.032, 0.29);
          float gravity = 1.05 / max(radius * radius * radius, 0.001);
          vec3 perpendicular = position - direction * dot(position, direction);
          vec3 newDir = normalize(direction - ds * gravity * perpendicular);
          vec3 newPos = position + newDir * ds;

          // A plane crossing can occur in front OR behind the shadow.
          if (position.y * newPos.y < 0.0) {
            float fraction = position.y / (position.y - newPos.y);
            vec3 hit = mix(position, newPos, fraction);
            float r = length(hit.xz);
            if (r > 0.84 && r < 4.0) {
              float a = atan(hit.z, hit.x);
              float spin = u_time * 0.62 / pow(max(r, 1.0), 1.42);
              float threads = sin(a * 27.0 - spin * 1.6 + r * 13.0);
              float filaments = sin(a * 63.0 - spin * 3.0 + r * 42.0);
              float wisps = sin(a * 121.0 - spin * 2.3 + r * 88.0);
              float streaks = 0.78 + 0.19 * threads + 0.125 * filaments + 0.065 * wisps;

              float edge = smoothstep(0.84, 1.02, r) * (1.0 - smoothstep(3.05, 4.0, r));
              float innerHeat = bell(r - 1.15, 0.50);
              float kinematic = 0.94 + 0.11 * hit.x / max(r, 0.85);
              float energy = edge * (0.30 + 1.65 * innerHeat) * max(0.04, streaks) * kinematic;
              // Film-inspired amber-white palette, neutral on both sides.
              vec3 plasma = vec3(1.02 + 0.43 * innerHeat,
                                 0.54 + 0.36 * innerHeat,
                                 0.31 + 0.45 * innerHeat);
              float coverage = clamp(energy * 0.52, 0.0, 0.98);
              diskColor += (1.0 - opacity) * plasma * energy * coverage;
              opacity += (1.0 - opacity) * coverage;
            }
          }
          position = newPos;
          direction = newDir;
          if (length(position) > 11.0 && dot(position, direction) > 0.0) break;
          if (opacity > 0.98) break;
        }
      }

      // The photon-ring-like highlights and weak forward scattering.
      float photon = bell(impact - 1.10, 0.038) * 0.34;
      float diffusion = bell(impact - 1.40, 0.30) * 0.14;
      vec3 rim = vec3(photon * 0.94 + diffusion * 0.8,
                      photon * 0.63 + diffusion * 0.4,
                      photon * 0.48 + diffusion * 0.6);
      diskColor += rim * (1.0 - opacity);

      if (captured && opacity < 0.20) {
        diskColor = vec3(0.0008, 0.0007, 0.0019);
      }

      // Sparse background stars are gravitationally displaced with the rays.
      vec2 sky = direction.xy / (1.0 + abs(direction.z));
      vec2 starUV = sky * 1.65 + vec2(7.19, 3.81);
      float stars = starfield(starUV, 67.0, 0.9975)
                  + 0.55 * starfield(starUV + 8.2, 120.0, 0.9985);
      if (captured) stars = 0.0;
      float isDisk = smoothstep(0.0, 0.5, opacity);
      vec3 space = vec3(0.0015, 0.0013, 0.0032);
      space += vec3(0.34, 0.31, 0.49) * stars * (1.0 - isDisk);
      float gas = bell(length(uv * vec2(1.05, 1.40)) - 0.29, 0.30);
      space += vec3(0.010, 0.005, 0.019) * gas * (1.0 - isDisk);

      vec3 color = diskColor + space * (1.0 - opacity);
      color = 1.0 - exp(-max(vec3(0.0), color) * 2.60);
      color = pow(color, vec3(0.92));
      // Soft vignette reduces eye strain around the navigation controls.
      float vignette = 1.0 - 0.25 * smoothstep(0.34, 0.75, length(uv));
      fragColor = vec4(color * vignette, 1.0);
    }
  `;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Shader creation failed');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'GLSL compilation failed';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createGraphics() {
    const gl = canvas.getContext('webgl2', {
      alpha: false, depth: false, antialias: false,
      powerPreference: 'low-power', preserveDrawingBuffer: false
    });
    if (!gl) return null;
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Program linking failed';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    return {
      gl, vao, program, buffer,
      uniform: {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        pointer: gl.getUniformLocation(program, 'u_pointer'),
        speed: gl.getUniformLocation(program, 'u_speed')
      }
    };
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let overridePause = null;
  let pointer = [0, 0];
  let pointerTarget = [0, 0];
  let graphics = null;
  let inViewport = true;
  let animation = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let lastAdvance = 0;
  let density = 1;
  let slowFrames = 0;

  function paused() { return overridePause === null ? motionPreference.matches : overridePause; }
  function visible() { return !document.hidden && inViewport && !!card.closest('.active-page'); }
  function updateButton() {
    const pausedNow = paused();
    motionToggle.textContent = pausedNow ? '▶ Анимация' : 'Ⅱ Пауза';
    motionToggle.setAttribute('aria-pressed', String(pausedNow));
    motionToggle.setAttribute('aria-label', pausedNow ? 'Включить анимацию' : 'Остановить анимацию');
  }

  function resize() {
    if (!graphics) return false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const mobile = rect.width < 500 || window.innerWidth < 750;
    const maxDpr = mobile ? 0.77 : 1.08;
    const dpr = Math.max(0.48, Math.min(window.devicePixelRatio || 1, maxDpr) * density);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      graphics.gl.viewport(0, 0, width, height);
    }
    return true;
  }

  function render(timestamp) {
    animation = 0;
    if (!graphics || !visible()) return;
    const lowPower = card.clientWidth < 500 || window.innerWidth < 750;
    const frameInterval = lowPower ? 1000 / 24 : 1000 / 34;
    if (!paused() && lastFrame && timestamp - lastFrame < frameInterval) {
      animation = requestAnimationFrame(render);
      return;
    }
    if (!resize()) return;

    if (!paused()) {
      const delta = lastAdvance ? Math.min(0.075, (timestamp - lastAdvance) * .001) : 0;
      elapsed += delta;
      pointer[0] += (pointerTarget[0] - pointer[0]) * 0.065;
      pointer[1] += (pointerTarget[1] - pointer[1]) * 0.065;
      if (lastFrame && timestamp - lastFrame > frameInterval * 1.6) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 2);
      // Adapt to slower GPUs without loading any external library.
      if (slowFrames > 12 && density > 0.68) {
        density = Math.max(0.68, density - .12);
        slowFrames = 0;
      }
    }
    lastAdvance = timestamp;
    lastFrame = timestamp;

    const { gl, vao, program, uniform } = graphics;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniform.time, elapsed);
    gl.uniform2f(uniform.pointer, pointer[0], pointer[1]);
    gl.uniform1f(uniform.speed, lowPower ? 1.18 : 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!paused()) animation = requestAnimationFrame(render);
  }

  function update() {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    lastAdvance = 0;
    const shown = visible();
    card.classList.toggle('cosmic-paused', paused());
    card.classList.toggle('cosmic-idle', !shown);
    updateButton();
    if (shown && graphics) animation = requestAnimationFrame(render);
  }

  try {
    graphics = createGraphics();
    if (graphics) card.classList.add('cosmic-webgl');
  } catch (error) {
    console.warn('Cosmic hero: WebGL2 unavailable, using image fallback.', error);
    graphics = null;
  }

  motionToggle.addEventListener('click', () => {
    overridePause = !paused();
    update();
  });
  card.addEventListener('pointermove', (event) => {
    if (paused()) return;
    const rect = card.getBoundingClientRect();
    pointerTarget = [
      Math.max(-1, Math.min(1, 2 * ((event.clientX - rect.left) / rect.width - 0.5))),
      Math.max(-1, Math.min(1, 2 * ((event.clientY - rect.top) / rect.height - 0.5)))
    ];
  }, { passive: true });
  card.addEventListener('pointerleave', () => { pointerTarget = [0, 0]; });
  window.addEventListener('hashchange', () => requestAnimationFrame(update));
  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('visibilitychange', update);
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', update);
  if (window.IntersectionObserver) {
    new IntersectionObserver(entries => {
      inViewport = !!entries[0]?.isIntersecting;
      update();
    }, { threshold: 0.02 }).observe(card);
  }
  if (window.ResizeObserver) new ResizeObserver(update).observe(card);

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    graphics = null;
    card.classList.remove('cosmic-webgl');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      graphics = createGraphics();
      if (graphics) card.classList.add('cosmic-webgl');
    } catch (error) {
      console.warn('Cosmic hero: WebGL2 restore failed.', error);
    }
    update();
  });
  update();
})();
