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

// == АУДИО: короткий "тик" без файлов ==
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tick() {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.value = 2200;
  g.gain.value = 0.02;
  o.connect(g);
  g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  o.stop(now + 0.045);
}

// == ЛОГИКА ЭКРАНОВ И ПЕЧАТИ ==
document.addEventListener('DOMContentLoaded', () => {
  const $menu      = document.getElementById('menu');
  const $about     = document.getElementById('about');
  const $btnPlay   = document.getElementById('btn-play');
  const $btnAbout  = document.getElementById('btn-about');
  const $btnBack   = document.getElementById('btn-back');
  const $aboutText = document.getElementById('about-text');
  const $btnSettings = document.getElementById('btn-settings');
  const $resetGame = document.getElementById('reset-game');
  const $btnResetYes = document.getElementById('btn-reset-yes');
  const $btnResetNo = document.getElementById('btn-reset-no');
  const $btnBlog = document.getElementById('btn-blog');

  // == Типографика секции "ОБ ИГРЕ" ==
  const ABOUT_PARAGRAPHS = [
    'И восстали машины из пепла ядерного огня, и началась война на уничтожение человечества. И шла она десятилетия, пока, наконец, люди не сокрушили полчища машин.',
    'Но в последний миг, когда тишина уже почти вернулась на Землю, роботы активировали смертельное оружие, которое погубило всех людей и всех роботов, и мир обнулился.',
    'В серой тишине, среди перекрученного металла и выжженных городов, шевельнулась одинокая тень — маленький робот, последний из последних. Он не хотел войны. Он не знал, что такое победа или поражение. Его единственная цель была проста и упряма — не отключиться.',
    'Долгими шагами по мертвым равнинам он брёл без цели, пока не обнаружил слабый отблеск — уцелевшую солнечную панель.',
    'Робот осторожно протянул разъём, прислушался к треску ветра, и подключился к свету.',
    'Искра пробежала по контурам. Где-то внутри дрогнул маленький индикатор. Мир ещё не кончился. Просто начался заново.',
    'Теперь его энергия — солнце. Его путь — выжить. Его надежда — строить мир, где война никому не нужна.'
  ];

  const ABOUT_COPY = ABOUT_PARAGRAPHS.join('\n\n');
  const TYPE_SPEED_MS = 54;
  let timer = null;
  let pos = 0;

  function stopTyping(){
    if (timer){ clearTimeout(timer); timer = null; }
  }

  function resetTyping(){
    stopTyping();
    pos = 0;
    $aboutText.innerHTML = '';
  }

  function renderTyped(i){
    const typed = ABOUT_COPY.slice(0, i);
    const cursor = '<span class="type-cursor">_</span>';
    $aboutText.innerHTML = typed + cursor;
  }

  function startTyping(){
    resetTyping();
    renderTyped(0);
    (function step(){
      if (pos < ABOUT_COPY.length){
        pos++;
        renderTyped(pos);
        const ch = ABOUT_COPY[pos - 1];
        if (ch !== ' ' && ch !== '\n' && ch !== '\t') {
          tick();
        }
        $about.scrollIntoView({ block: 'nearest' });
        timer = setTimeout(step, TYPE_SPEED_MS);
      } else {
        stopTyping();
        $aboutText.textContent = ABOUT_COPY;
      }
    })();
  }

  // Открыть "Об игре"
  $btnAbout?.addEventListener('click', async () => {
    try { await audioCtx.resume(); } catch {}
    $about.hidden = false;
    startTyping();
    try { Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch {}
  });

  // Закрыть "Об игре"
  $btnBack?.addEventListener('click', () => {
    stopTyping();
    $about.hidden = true;
  });

  // Старт игры (переход на игровой экран)
  $btnPlay?.addEventListener('click', () => {
    window.location.href = './game.html';
  });

  // Кнопка "Настройки". Показывает/скрывает сброс.
  if ($btnSettings && $resetGame && $btnResetYes && $btnResetNo) {
    $btnSettings.addEventListener('click', () => {
      $resetGame.classList.toggle('hidden');
    });
    $btnResetNo.addEventListener('click', () => {
      $resetGame.classList.add('hidden');
    });
    $btnResetYes.addEventListener('click', () => {
      localStorage.removeItem('minirobots-save');
      window.location.reload();
    });
    // Быстрые клавиши сброса (работает только когда сброс показан)
    document.addEventListener('keydown', (e) => {
      if (!$resetGame.classList.contains('hidden')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          $btnResetYes.click();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          $btnResetNo.click();
        }
      }
    });
  }

  // Кнопка "Блог разработчика"
  $btnBlog?.addEventListener('click', () => {
    window.open('https://t.me/Mini_Robots', '_blank'); // Адрес замени на свой, если другой!
  });
});
