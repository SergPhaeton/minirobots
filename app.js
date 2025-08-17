// == ИНИЦИАЛИЗАЦИЯ TELEGRAM (безопасно и вне Telegram) ==
(function initTMA(){
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const scheme = Telegram.WebApp.colorScheme; // 'light' | 'dark'
      const header = (scheme === 'dark') ? '#000000' : '#ffffff';
      Telegram.WebApp.setHeaderColor?.(header);
    }
  } catch (e) { /* игнорируем ошибки среды */ }
})();

// == ЛОГИКА ЭКРАНОВ И ПЕЧАТИ ==
document.addEventListener('DOMContentLoaded', () => {
  const $menu      = document.getElementById('menu');
  const $about     = document.getElementById('about');
  const $btnPlay   = document.getElementById('btn-play');
  const $btnAbout  = document.getElementById('btn-about');
  const $btnBack   = document.getElementById('btn-back');

  // Узлы печати
  const $aboutText  = document.getElementById('about-text');
  const $typeCursor = document.getElementById('type-cursor');

  // ——— ТЕКСТ ДЛЯ ПЕЧАТИ С АБЗАЦАМИ ———
  // Абзацы разделены пустой строкой. Печатаем посимвольно, сохраняя переносы.
  const ABOUT_PARAGRAPHS = [
    'И восстали машины из пепла ядерного огня, и началась война на уничтожение человечества. И шла она десятилетия, пока, наконец, люди не сокрушили полчища машин.',
    'Но в последний миг, когда тишина уже почти вернулась на Землю, автоматы запустили ядерные огни, и кричащие небеса опустели. Умерли люди. Исчезли роботы. И мир стал нуль.',
    'Однако пепел не забыл тепла.',
    'В серой тишине, среди перекрученного металла и выжженных городов, шевельнулась одинокая тень — маленький робот, последний из последних. Он не хотел войны. Он не знал, что такое победа или поражение. Его единственная цель была проста и упряма — не отключиться.',
    'Долгими шагами по мертвым равнинам он брёл без цели, пока случай не подарил ему слабый отблеск — целую, уцелевшую солнечную панель.',
    'Робот осторожно протянул разъём, прислушался к треску ветра, и подключился к свету.',
    'Искра пробежала по контурам. Где‑то внутри дрогнул маленький индикатор. Мир ещё не кончился. Просто начался заново.',
    'Теперь его энергия — солнце. Его путь — выжить. Его надежда — строить мир, где война больше не нужна.'
  ];

  // Собираем единый текст с пустыми строками между абзацами
  const ABOUT_COPY = ABOUT_PARAGRAPHS.join('\n\n');

  // ——— НАСТРОЙКИ СКОРОСТИ ———
  // Медленнее в 3 раза: 54 мс на символ. Можно менять на вкус.
  const TYPE_SPEED_MS  = 54;
  const END_PAUSE_MS   = 600;

  let timer = null;
  let pos = 0;

  function stopTyping() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function resetTyping() {
    stopTyping();
    pos = 0;
    if ($aboutText) $aboutText.textContent = '';
  }

  function startTyping() {
    resetTyping();

    function step() {
      if (pos < ABOUT_COPY.length) {
        // Печатаем следующий символ
        $aboutText.textContent = ABOUT_COPY.slice(0, ++pos);
        // Автопрокрутка внутри экрана "Об игре", если текст длинный
        $about.scrollIntoView({ block: 'nearest' });
        timer = setTimeout(step, TYPE_SPEED_MS);
      } else {
        // Небольшая пауза по завершении
        timer = setTimeout(() => {}, END_PAUSE_MS);
      }
    }

    step();
  }

  // Переход в "Об игре" — показываем экран и запускаем печать
  $btnAbout.addEventListener('click', () => {
    $menu.hidden = true;
    $about.hidden = false;
    startTyping();
    try { Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch {}
  });

  // Назад в меню — останавливаем печать
  $btnBack.addEventListener('click', () => {
    stopTyping();
    $about.hidden = true;
    $menu.hidden = false;
  });

  // Заглушка для "Играть" — добавим позже
  $btnPlay.addEventListener('click', () => {
    // TODO: экран игры
  });
});
