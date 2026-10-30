/* Cosmic hero: self-contained, dependency-free WebGL2 black hole for GitHub Pages.
 * Preserves existing #hash navigation and a static fallback when WebGL2 is unavailable.
 */
(() => {
  'use strict';

  const card = document.querySelector('#page-home .hero-art');
  if (!card || card.dataset.cosmicInitialized === '1') return;
  card.dataset.cosmicInitialized = '1';

  const strings = {
    label: '\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f \u043f\u043e \u0440\u0430\u0437\u0434\u0435\u043b\u0430\u043c \u0441\u0430\u0439\u0442\u0430',
    home: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f',
    projects: 'AI-\u043f\u0440\u043e\u0435\u043a\u0442\u044b',
    cases: '\u041a\u0435\u0439\u0441\u044b',
    skills: '\u0421\u0442\u0435\u043a',
    contact: '\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f',
    pause: '\u041f\u0430\u0443\u0437\u0430',
    play: '\u0410\u043d\u0438\u043c\u0430\u0446\u0438\u044f',
    graphic: '\u0418\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u0430\u044f \u043a\u043e\u0441\u043c\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0441\u0446\u0435\u043d\u0430'
  };

  // Real HTML links are keyboard accessible and reuse the site's existing hash router.
  const destinations = [
    { id: 'home', tag: '01', label: strings.home, cls: 'cosmic-home' },
    { id: 'ai-projects', tag: '02', label: strings.projects, cls: 'cosmic-projects' },
    { id: 'experience', tag: '03', label: strings.cases, cls: 'cosmic-cases' },
    { id: 'skills', tag: '04', label: strings.skills, cls: 'cosmic-skills' },
    { id: 'contacts', tag: '05', label: strings.contact, cls: 'cosmic-contact' }
  ];

  const canvas = document.createElement('canvas');
  canvas.className = 'cosmic-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const fallback = document.createElement('div');
  fallback.className = 'cosmic-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = '<span class="cosmic-fallback-disk"></span><span class="cosmic-fallback-core"></span>';

  const orbits = document.createElement('div');
  orbits.className = 'cosmic-orbits';
  orbits.setAttribute('aria-hidden', 'true');
  orbits.innerHTML = '<span></span><span></span>';

  const nav = document.createElement('nav');
  nav.className = 'cosmic-nav';
  nav.setAttribute('aria-label', strings.label);
  destinations.forEach(item => {
    const link = document.createElement('a');
    link.href = '#' + item.id;
    link.className = 'cosmic-link ' + item.cls;
    link.setAttribute('aria-label', item.label);
    link.title = item.label;
    const number = document.createElement('span');
    number.className = 'cosmic-link-number';
    number.textContent = item.tag;
    const title = document.createElement('strong');
    title.className = 'cosmic-link-label';
    title.textContent = item.label;
    link.append(number, title);
    nav.append(link);
  });

  const pauseButton = document.createElement('button');
  pauseButton.type = 'button';
  pauseButton.className = 'cosmic-motion-toggle';
  pauseButton.setAttribute('aria-pressed', 'false');

  card.prepend(fallback, canvas, orbits);
  card.append(nav, pauseButton);
  card.classList.add('cosmic-active');
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', strings.graphic);

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = null;
  let inViewport = true;
  let frameId = 0;
  let lastRenderAt = 0;
  let startTime = performance.now();
  let pauseTime = 0;
  let pointer = [0, 0];
  let targetPointer = [0, 0];
  let graphics = null;

  function isPaused() { return userPaused === null ? reduceMotionQuery.matches : userPaused; }
  function isVisible() {
    return !document.hidden && inViewport && !!card.closest('.active-page');
  }
  function shouldAnimate() { return isVisible() && !isPaused(); }
  function updatePauseButton() {
    pauseButton.textContent = isPaused() ? '\u25b6 ' + strings.play : '\u23f8 ' + strings.pause;
    pauseButton.setAttribute('aria-pressed', String(isPaused()));
    pauseButton.setAttribute('aria-label', isPaused() ? strings.play : strings.pause);
  }
  updatePauseButton();

  const vertexShader = `#version 300 es
    in vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fragmentShader = `#version 300 es
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;
    out vec4 fragColor;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float gauss(float x, float width) { return exp(-x * x / (width * width)); }
    float sphereDistance(vec3 ro, vec3 rd, float radius) {
      float b = dot(ro, rd);
      float h = b * b - dot(ro, ro) + radius * radius;
      return h >= 0.0 ? -b - sqrt(h) : -1.0;
    }
    float starLayer(vec2 p, float gridSize, float threshold) {
      vec2 cell = floor(p * gridSize);
      vec2 local = fract(p * gridSize) - 0.5;
      float seed = hash21(cell);
      float present = smoothstep(threshold, 1.0, seed);
      float radius = mix(0.035, 0.12, hash21(cell + 7.73));
      float star = 1.0 - smoothstep(0.0, radius, length(local));
      return star * present * (0.6 + 0.4 * sin(u_time * 0.75 + seed * 17.0));
    }
    void main() {
      // The disk is a plane in 3D, the horizon is a ray-intersected black sphere.
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
      vec2 lens = uv * (1.0 + 0.035 / (dot(uv, uv) + 0.015));
      vec2 starsUv = lens + u_pointer * 0.009;
      float stars = starLayer(starsUv + 14.0, 63.0, 0.992)
                  + 0.44 * starLayer(starsUv - 20.0, 99.0, 0.995);

      vec3 color = vec3(0.015, 0.012, 0.024);
      color += vec3(0.055, 0.026, 0.089) * exp(-dot(uv, uv) * 16.0);
      color += vec3(0.65, 0.55, 0.90) * stars * 0.46;

      vec3 ro = vec3(u_pointer.x * 0.40, 2.15 - u_pointer.y * 0.35, 5.30);
      vec3 forward = normalize(-ro);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec2 screen = uv * 2.15;
      vec3 rd = normalize(forward * 2.85 + right * screen.x + up * screen.y);

      float sphereT = sphereDistance(ro, rd, 0.81);
      float impact = length(cross(ro, rd));
      // Photon ring / lensing-like highlight; intentionally stylized, not astrophysical simulation.
      float halo = gauss(impact - 1.06, 0.17) * 0.22;
      halo += gauss(impact - 0.89, 0.045) * 0.75;
      halo += gauss(impact - 0.82, 0.012) * 1.00;
      vec3 photonColor = mix(vec3(0.55, 0.31, 1.0), vec3(1.0, 0.52, 0.31),
                             smoothstep(-0.28, 0.26, uv.x));
      color += photonColor * halo;

      // 3D ray / accretion-plane intersection; depth-tested against the dark core.
      float planeT = -ro.y / rd.y;
      if (planeT > 0.0 && planeT < 22.0 && (sphereT <= 0.0 || planeT < sphereT)) {
        vec3 hit = ro + rd * planeT;
        float r = length(hit.xz);
        if (r >= 0.86 && r <= 3.02) {
          float theta = atan(hit.z, hit.x);
          float energy = smoothstep(0.86, 1.02, r) * (1.0 - smoothstep(2.58, 3.02, r));
          float angularVelocity = 2.0 / pow(max(r, 0.9), 1.35);
          float streaks = sin(theta * 36.0 - u_time * angularVelocity + 16.0 * r);
          float spiral = sin(theta * 11.0 - u_time * 0.64 + 10.8 * r);
          float detail = sin(theta * 84.0 - u_time * 1.20 + 28.0 * r);
          float rings = 0.65 + 0.22 * streaks + 0.15 * spiral + 0.09 * detail;
          float innerHeat = gauss(r - 1.05, 0.27) * 1.4;
          float outerGlow = gauss(r - 1.9, 0.77) * 0.55;
          float doppler = smoothstep(-0.4, 0.8, hit.x);
          vec3 purple = vec3(0.47, 0.27, 1.05);
          vec3 coral = vec3(1.18, 0.33, 0.18);
          vec3 plasma = mix(purple, coral, doppler * 0.85 + 0.08);
          plasma += vec3(0.53, 0.38, 0.30) * innerHeat;
          float brightness = max(0.04, rings) * energy * (0.52 + innerHeat + outerGlow);
          color += plasma * brightness * 1.26;
          // Hot narrow orbit near the innermost edge.
          color += vec3(1.0, 0.73, 0.59) * gauss(r - 1.025, 0.062) * energy * 0.46;
        }
      }

      // The shadow has no surface reflection: an approximate event horizon.
      if (sphereT > 0.0) {
        color = vec3(0.0015, 0.0012, 0.004);
        float rim = gauss(impact - 0.805, 0.017);
        color += photonColor * rim * 0.30;
      }

      // Additional atmospheric halo creates a cinematic rather than simulation-grade look.
      float radial = length(uv);
      color += vec3(0.16, 0.08, 0.27) * gauss(radial - 0.28, 0.21) * 0.18;
      color *= 1.0 - 0.25 * smoothstep(0.38, 0.75, radial);
      color = color / (1.0 + color);
      color = pow(color, vec3(0.92));
      fragColor = vec4(color, 1.0);
    }
  `;

  function makeShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || 'Unknown shader compilation error');
    }
    return shader;
  }

  function initGraphics() {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false
    });
    if (!gl) return null;
    const vs = makeShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(message || 'Unknown program linking error');
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    return {
      gl,
      program,
      vao,
      uniforms: {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        pointer: gl.getUniformLocation(program, 'u_pointer')
      }
    };
  }

  try {
    graphics = initGraphics();
    if (graphics) card.classList.add('cosmic-webgl');
  } catch (error) {
    console.warn('Cosmic hero WebGL unavailable; using CSS fallback.', error);
    graphics = null;
  }

  function resize() {
    if (!graphics) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const isMobile = rect.width < 480 || window.innerWidth < 768;
    const quality = isMobile ? 0.9 : 1.28;
    const dpr = Math.min(window.devicePixelRatio || 1, quality);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      graphics.gl.viewport(0, 0, width, height);
    }
  }

  function render(now) {
    frameId = 0;
    if (!isVisible() || !graphics) return;
    const frameBudget = card.clientWidth < 480 ? 1000 / 30 : 1000 / 50;
    if (shouldAnimate() && lastRenderAt && now - lastRenderAt < frameBudget) {
      frameId = window.requestAnimationFrame(render);
      return;
    }
    lastRenderAt = now;
    resize();
    if (canvas.width < 2 || canvas.height < 2) return;
    if (!isPaused()) {
      pointer[0] += (targetPointer[0] - pointer[0]) * 0.055;
      pointer[1] += (targetPointer[1] - pointer[1]) * 0.055;
      pauseTime = (now - startTime) * 0.001;
    }
    const { gl, program, vao, uniforms } = graphics;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, pauseTime);
    gl.uniform2f(uniforms.pointer, pointer[0], pointer[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (shouldAnimate()) frameId = window.requestAnimationFrame(render);
  }

  function updateRunning() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    const visible = isVisible();
    card.classList.toggle('cosmic-paused', isPaused());
    card.classList.toggle('cosmic-idle', !visible);
    updatePauseButton();
    if (visible && graphics) frameId = window.requestAnimationFrame(render);
  }

  pauseButton.addEventListener('click', () => {
    // A deliberate click may opt in to animation even when reduced motion is set.
    userPaused = !isPaused();
    startTime = performance.now() - pauseTime * 1000;
    updateRunning();
  });

  card.addEventListener('pointermove', event => {
    if (isPaused()) return;
    const bounds = card.getBoundingClientRect();
    targetPointer = [
      Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2)),
      Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2))
    ];
  }, { passive: true });
  card.addEventListener('pointerleave', () => { targetPointer = [0, 0]; });
  document.addEventListener('visibilitychange', updateRunning);
  window.addEventListener('hashchange', () => window.requestAnimationFrame(updateRunning));
  window.addEventListener('resize', updateRunning, { passive: true });
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', updateRunning);
  }
  if (window.ResizeObserver) new ResizeObserver(updateRunning).observe(card);
  if (window.IntersectionObserver) {
    new IntersectionObserver(entries => {
      inViewport = !!entries[0]?.isIntersecting;
      updateRunning();
    }, { threshold: 0.01 }).observe(card);
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    graphics = null;
    card.classList.remove('cosmic-webgl');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      graphics = initGraphics();
      if (graphics) card.classList.add('cosmic-webgl');
      updateRunning();
    } catch (error) { console.warn('Failed to restore cosmic hero WebGL.', error); }
  });
  updateRunning();
})();
