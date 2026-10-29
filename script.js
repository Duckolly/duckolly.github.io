(() => {
  'use strict';

  // Display only verified/user-supplied contact methods.
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
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) linkSpecs.push({label: 'Email ↗', href: 'mailto:' + email});
  if (/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) linkSpecs.push({label: 'Telegram ↗', href: 'https://t.me/' + telegram});
  if (/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(linkedin)) linkSpecs.push({label: 'LinkedIn ↗', href: linkedin});
  if (extraLinks) linkSpecs.forEach(spec => {
    const link = document.createElement('a');
    link.href = spec.href;
    link.textContent = spec.label;
    if (spec.href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    extraLinks.append(link);
  });

  // Progressive enhancement: the site content is fully present in static HTML.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Открыть меню');
    };
    menuButton.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(opened));
      menuButton.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const projectCards = [...document.querySelectorAll('.project-card')];
  const filterStatus = document.getElementById('filter-status');
  // Derive filter counts from the source cards to prevent stale UI numbers.
  filterButtons.forEach(button => {
    const type = button.dataset.filter;
    const count = type === 'all' ? projectCards.length
      : projectCards.filter(card => card.dataset.category === type).length;
    const counter = button.querySelector('span');
    if (counter) counter.textContent = String(count).padStart(2, '0');
  });
  if (filterStatus) filterStatus.textContent = 'Показано проектов: ' + projectCards.length;
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
