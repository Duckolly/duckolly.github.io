/*
 * Персональные ссылки Сергея Швецова.
 * В этом файле также подключается автономная 3D-сцена главной страницы.
 */
window.PORTFOLIO_CONTACTS = {
  github: "https://github.com/Duckolly",
  email: "ot7s@mail.ru",
  telegram: "SergeyShvetsov",
  linkedin: ""
};

// Текущие index.html / script.js / styles.css не нужно менять.
// GitHub Pages загружает два локальных ресурса без npm, CDN или сервера.
(() => {
  'use strict';

  if (!document.querySelector('link[data-cosmic-hero]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = './cosmic-hero.css';
    stylesheet.dataset.cosmicHero = 'style';
    document.head.append(stylesheet);
  }

  const loadScene = () => {
    if (document.querySelector('script[data-cosmic-hero]')) return;
    const script = document.createElement('script');
    script.src = './cosmic-hero.js';
    script.dataset.cosmicHero = 'script';
    script.onerror = () => console.warn('Cosmic hero: не удалось загрузить cosmic-hero.js');
    document.head.append(script);
  };

  if (document.readyState === 'complete') {
    loadScene();
  } else {
    document.addEventListener('DOMContentLoaded', loadScene, { once: true });
  }
})();
