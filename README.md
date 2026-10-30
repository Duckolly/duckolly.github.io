# Гаргантюа — исправление интеграции для duckolly.github.io

## Что исправляется

1. Подключение `cosmic-hero.css` **после** `styles.css` в `index.html`.
2. Подключение существующего `cosmic-hero.js` **после** `script.js`.
3. Удаление оборванного блока `GARGANTUA V4 INLINE UPGRADE` из `script.js` с восстановлением закрытия основного IIFE и обновления года.
4. Полный CSS для `canvas`, локального fallback, интерактивных HTML-ссылок, mobile/responsive и кнопки паузы.
5. Масштаб и смещение рендеринга настраиваются CSS-переменными.

**Важно:** оригинальные `cosmic-hero.js` и `gargantua-fallback.webp` уже должны находиться в репозитории. Эти файлы не заменяются и не модифицируются. Реальная физическая модель — художественная визуализация, не точное моделирование метрики Керра.

## Как применить

1. Распакуйте архив. В локально клонированном репозитории должна быть папка с `index.html`, `script.js`, `styles.css`, `cosmic-hero.js`, `gargantua-fallback.webp`.
2. Скопируйте **`cosmic-hero.css`**, **`apply_gargantua.py`** и **`verify_gargantua.py`** в корень репозитория.
3. Из корня репозитория выполните:

   ```bash
   python apply_gargantua.py .
   node --check script.js
   node --check cosmic-hero.js
   python verify_gargantua.py .
   ```

4. При успешной проверке:

   ```bash
   git diff --check
   git add index.html script.js cosmic-hero.css
   git commit -m "Fix Gargantua hero integration and CSS sizing"
   git push
   ```

5. После публикации GitHub Pages откройте сайт в приватном окне либо обновите с очисткой кэша (Ctrl+Shift+R).

**Резервные копии:** изменяемые оригинальные файлы сохраняются в `.gargantua-backup/<timestamp>/` (не добавляйте их в Git). Скрипт рассчитан на многократный запуск и не размножает подключения.

## Размеры и расположение

Все настройки в начале `cosmic-hero.css`:

```css
#page-home .hero-art.cosmic-active {
  --gargantua-scale: 1.12; /* визуальный масштаб чёрной дыры */
  --gargantua-x: 4%;        /* сдвиг вправо/влево */
  --gargantua-y: -2%;       /* сдвиг вверх/вниз */
  --gargantua-card-height: 460px; /* минимальная высота панели */
}
```

Мобильные значения (до 620px) определены отдельным `@media` в конце файла. Не применяйте `transform` к `.hero-art` или `.cosmic-nav`: это увеличит кнопки и создаст проблемы с попаданием курсора. Используйте переменные выше.

## Критерии проверки

- В DevTools → Network обе ссылки `cosmic-hero.css` и `cosmic-hero.js` имеют статус 200.
- Для `#page-home .hero-art` появляются классы `cosmic-active` и (при наличии WebGL2) `cosmic-webgl`.
- В DOM появляется `canvas.cosmic-canvas`, а также `nav.cosmic-nav` с 5 ссылками.
- При отключении WebGL2 виден `gargantua-fallback.webp` и ссылки остаются кликабельными.
- На 360/390px карточка не порождает горизонтальную прокрутку и элементы не перекрывают друг друга.
- Кнопка `Пауза / Анимация` переключает отрисовку.
- Остальные вкладки, бургер-меню и фильтры работают после устранения SyntaxError в `script.js`.

Если отсутствует WebGL2, изображение должно отображаться без анимации, но навигационные ссылки остаются рабочими.
