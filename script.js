(() => {
  'use strict';

  // 1. Контакты
  const contacts = window.PORTFOLIO_CONTACTS || {};
  const github = typeof contacts.github === 'string' && /^https:\/\/github\.com\/[a-z0-9-]+\/?$/i.test(contacts.github.trim())
    ? contacts.github.trim() : 'https://github.com/Duckolly';

  document.querySelectorAll('[data-contact="github"]').forEach(link => {
    link.href = github;
    if (link.classList.contains('github-link')) {
      link.textContent = github.replace(/^https:\/\//, '').replace(/\/$/, '') + ' ↗';
    }
  });

  const extraLinks = document.getElementById('extra-contact-links');
  const linkSpecs = [];
  const email = String(contacts.email || '').trim();
  const telegram = String(contacts.telegram || '').trim().replace(/^@/, '');
  const linkedin = String(contacts.linkedin || '').trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) linkSpecs.push({label: 'Email: ' + email + ' ↗', href: 'mailto:' + email});
  if (/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) linkSpecs.push({label: 'Telegram: @' + telegram + ' ↗', href: 'https://t.me/' + telegram});
  if (/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(linkedin)) linkSpecs.push({label: 'LinkedIn ↗', href: linkedin});

  if (extraLinks) {
    extraLinks.innerHTML = '';
    linkSpecs.forEach(spec => {
      const link = document.createElement('a');
      link.href = spec.href;
      link.textContent = spec.label;
      if (spec.href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      extraLinks.append(link);
    });
  }

  // 2. Механизм многостраничности (Tab Router)
  const pages = document.querySelectorAll('.page-view');

  function showPage(pageId) {
    if (!pageId) pageId = 'home';
    pageId = pageId.replace(/^#/, '');

    let targetPage = document.getElementById('page-' + pageId);
    if (!targetPage) {
      targetPage = document.getElementById('page-home');
      pageId = 'home';
    }

    pages.forEach(p => p.classList.remove('active-page'));
    if (targetPage) {
      targetPage.classList.add('active-page');
    }

    // Подсветка активной ссылки в шапке
    document.querySelectorAll('.site-nav a').forEach(a => {
      const href = a.getAttribute('href').replace(/^#/, '');
      if (href === pageId) {
        a.classList.add('active-tab');
      } else {
        a.classList.remove('active-tab');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Обработка кликов по навигации
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const targetHash = link.getAttribute('href');
      if (targetHash && targetHash !== '#top') {
        e.preventDefault();
        window.location.hash = targetHash;
        showPage(targetHash);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    showPage(window.location.hash || 'home');
  });

  // Инициализация при первой загрузке
  showPage(window.location.hash || 'home');

  // 3. Мобильное бургер-меню
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    };
    menuButton.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(opened));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  }

  // 4. Фильтры кейсов на странице "Кейсы"
  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const projectCards = [...document.querySelectorAll('.project-card')];
  const filterStatus = document.getElementById('filter-status');

  filterButtons.forEach(button => {
    const type = button.dataset.filter;
    const count = type === 'all' ? projectCards.length
      : projectCards.filter(card => card.dataset.category === type).length;
    const counter = button.querySelector('span');
    if (counter) counter.textContent = String(count).padStart(2, '0');
  });

  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    let visibleCount = 0;
    projectCards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.hidden = !show;
      if (show) visibleCount++;
    });
    if (filterStatus) filterStatus.textContent = 'Показано проектов: ' + visibleCount;
  }));

  
// GARGANTUA V4 INLINE UPGRADE
// Add this block to the END of config.js.
// Requires existing cosmic-hero.js and cosmic-hero.css.

(() => {
  'use strict';

  const install = () => {
    const card = document.querySelector(
      '#page-home .hero-art.cosmic-active'
    );

    if (!card || !card.querySelector('.cosmic-canvas')) {
      return false;
    }

    if (card.dataset.cosmicV4Upgrade === '1') {
      return true;
    }

    // Avoid duplicating effects if full v4 is already installed.
    if (card.querySelector('.cosmic-sparks')) {
      return true;
    }

    card.dataset.cosmicV4Upgrade = '1';

    const css = document.createElement('style');
    css.id = 'cosmic-v4-inline-style';
    css.textContent = `
      #page-home .hero-art.cosmic-active .cosmic-canvas,
      #page-home .hero-art.cosmic-active .cosmic-fallback img {
        filter: brightness(var(--cosmic-v4-light, 1.04))
                saturate(1.12);
        transition: filter 180ms ease-out;
      }

      #page-home .cosmic-v4-halo {
        position: absolute;
        left: 27%;
        top: 25%;
        width: 56%;
        height: 49%;
        z-index: 2;
        border-radius: 50%;
        pointer-events: none;

        box-shadow:
          0 0 26px 3px rgba(255, 197, 102, .12),
          0 0 56px rgba(212, 223, 255, .08),
          inset 0 0 28px rgba(239, 200, 156, .06);

        animation: cosmic-v4-pulse 8.5s ease-in-out infinite;
      }

      #page-home .cosmic-v4-sparks {
        position: absolute;
        inset: 0;
        z-index: 3;
        overflow: hidden;
        pointer-events: none;
        contain: paint;
      }

      #page-home .cosmic-v4-spark {
        position: absolute;
        left: var(--sx);
        top: var(--sy);
        width: var(--size);
        height: var(--size);
        background: #ffd995;
        border-radius: 50%;
        opacity: 0;

        box-shadow:
          0 0 8px rgba(255, 185, 87, .75),
          0 0 17px rgba(255, 160, 69, .27);

        animation:
          cosmic-v4-drift var(--life)
          ease-out var(--delay) infinite;
      }

      #page-home .cosmic-v4-spark.silver {
        background: #e7efff;

        box-shadow:
          0 0 8px rgba(210, 224, 255, .84),
          0 0 17px rgba(210, 224, 255, .32);
      }

      @keyframes cosmic-v4-pulse {
        0%, 100% {
          opacity: .28;
          transform: scale(.987);
        }
        50% {
          opacity: .54;
          transform: scale(1.015);
        }
      }

      @keyframes cosmic-v4-drift {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(.35);
        }
        14% {
          opacity: .76;
        }
        50% {
          opacity: .48;
        }
        100% {
          opacity: 0;
          transform: translate(
            calc(-50% + var(--dx)),
            calc(-50% + var(--dy))
          ) scale(.20);
        }
      }

      #page-home .hero-art.cosmic-paused .cosmic-v4-halo,
      #page-home .hero-art.cosmic-paused .cosmic-v4-spark,
      #page-home .hero-art.cosmic-idle .cosmic-v4-halo,
      #page-home .hero-art.cosmic-idle .cosmic-v4-spark {
        animation-play-state: paused;
      }

      @media (max-width: 620px) {
        #page-home .cosmic-v4-spark:nth-child(n+11) {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #page-home .cosmic-v4-halo,
        #page-home .cosmic-v4-sparks {
          display: none;
        }

        #page-home .hero-art.cosmic-active .cosmic-canvas {
          transition: none;
        }
      }
    `;

    document.head.append(css);

    const halo = document.createElement('span');
    halo.className = 'cosmic-v4-halo';
    halo.setAttribute('aria-hidden', 'true');

    const sparks = document.createElement('span');
    sparks.className = 'cosmic-v4-sparks';
    sparks.setAttribute('aria-hidden', 'true');

    // Generate 18 particles on the accretion ring.
    for (let i = 0; i < 18; i++) {
      const angle = (i * 137.508 + 12) * Math.PI / 180;

      const radiusX = 26 + (i % 4) * 0.8;
      const radiusY = 25 + (i % 3) * 0.7;
      const drift = 22 + (i % 6) * 7;

      const spark = document.createElement('i');

      spark.className =
        `cosmic-v4-spark${i % 3 === 0 ? ' silver' : ''}`;

      spark.style.setProperty(
        '--sx',
        `${54 + Math.cos(angle) * radiusX}%`
      );

      spark.style.setProperty(
        '--sy',
        `${49 + Math.sin(angle) * radiusY}%`
      );

      spark.style.setProperty(
        '--dx',
        `${Math.cos(angle) * drift}px`
      );

      spark.style.setProperty(
        '--dy',
        `${Math.sin(angle) * drift}px`
      );

      spark.style.setProperty(
        '--size',
        `${1.5 + (i % 4) * .65}px`
      );

      spark.style.setProperty(
        '--life',
        `${7 + (i % 5)}s`
      );

      spark.style.setProperty(
        '--delay',
        `${-((i * 3.7) % 11)}s`
      );

      sparks.append(spark);
    }

    card.append(halo, sparks);

    // Cursor affects the brightness of the existing scene.
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    card.addEventListener('pointermove', event => {
      if (
        reducedMotion.matches ||
        card.classList.contains('cosmic-paused')
      ) {
        return;
      }

      const rect = card.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      const distance = Math.hypot(
        x - .54,
        y - .49
      );

      const brightness =
        1.04 + .14 * (1 - Math.min(1, distance / .70));

      card.style.setProperty(
        '--cosmic-v4-light',
        brightness.toFixed(3)
      );
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty(
        '--cosmic-v4-light',
        '1.04'
      );
    });

    return true;
  };

  const ready = () => {
    if (install()) return;

    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    setTimeout(() => observer.disconnect(), 15000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      ready,
      { once: true }
    );
  } else {
    ready();
  }
})();


  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
