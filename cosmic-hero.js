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
    // GARGANTUA_OVERLAY_FIX_V1: transparent highlights on the original image.
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;
    uniform float u_speed;
    out vec4 fragColor;

    float bell(float value, float spread) {
      float t = value / spread;
      return exp(-t * t);
    }

    void main() {
      // Match object-fit: cover for gargantua-fallback.webp (1672 x 941).
      // Coordinates are expressed in units of the *original image height*.
      float aspect = u_resolution.x / u_resolution.y;
      float cover = max(1.0, aspect / (1672.0 / 941.0));
      vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) /
               (u_resolution.y * cover);
      p.x += u_pointer.x * 0.003;
      p.y += u_pointer.y * 0.002;

      // Lens arc lies above the original image's horizon, at y ~ 390 px.
      vec2 lensPoint = p - vec2(0.0, 0.079);
      float radius = length(lensPoint);
      float theta = atan(lensPoint.y, lensPoint.x);
      float lens = bell(radius - 0.157, 0.016)
                   * smoothstep(-0.026, 0.095, lensPoint.y);

      // The visible accretion sheet follows the original image's horizon.
      // Suppress light over the black central shadow (abs(x) < 0.14).
      float absX = abs(p.x);
      float planeY = -0.021;
      float planeWidth = 0.015 + 0.025 * min(absX, 0.8);
      float plane = bell(p.y - planeY, planeWidth)
                    * smoothstep(0.136, 0.21, absX)
                    * (1.0 - smoothstep(0.64, 0.86, absX));

      // Phase is wrapped to [0, 2pi) in JavaScript: no float precision drift.
      float lensThreads = 0.5 + 0.5 * sin(theta * 20.0 - u_time * 2.0
                                            + radius * 65.0);
      float planeThreads = 0.5 + 0.5 * sin(p.x * 44.0 - u_time * 3.0
                                             + p.y * 20.0);
      float strength = (0.62 * lens * (0.26 + 0.74 * lensThreads)
                     + 0.85 * plane * (0.25 + 0.75 * planeThreads))
                     / max(1.0, u_speed);

      // Transparent pixels reveal the source image, stars and both arcs.
      // Alpha never exceeds 0.13; no opaque replacement is possible.
      float alpha = clamp(strength * 0.12, 0.0, 0.13);
      vec3 glow = mix(vec3(1.0, 0.61, 0.28),
                      vec3(1.0, 0.88, 0.62), planeThreads * 0.6);
      fragColor = vec4(glow, alpha);
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
      alpha: true, premultipliedAlpha: false, depth: false, antialias: false,
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
    gl.uniform1f(uniform.time, (elapsed * 0.35) % (2 * Math.PI));
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
