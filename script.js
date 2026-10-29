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
  const navLinks = document.querySelectorAll('.site-nav a, a[href^="#"]');
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

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
