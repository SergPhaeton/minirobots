// Простая инициализация Telegram Mini App (без обязательности)
(function initTMA(){
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();        // скрыть плейсхолдер Telegram
      // Настроим цвет заголовка в тон теме
      const scheme = Telegram.WebApp.colorScheme; // 'light' | 'dark'
      const header = (scheme === 'dark') ? '#000000' : '#ffffff';
      if (Telegram.WebApp.setHeaderColor) Telegram.WebApp.setHeaderColor(header);
    }
  } catch(e) {
    // тихо игнорируем, чтобы всё работало и вне Telegram
  }
})();

// Логика экранов меню / об игре
document.addEventListener('DOMContentLoaded', () => {
  const $menu  = document.getElementById('menu');
  const $about = document.getElementById('about');

  const $btnPlay  = document.getElementById('btn-play');
  const $btnAbout = document.getElementById('btn-about');
  const $btnBack  = document.getElementById('btn-back');

  // Переход в "Об игре"
  $btnAbout.addEventListener('click', () => {
    $menu.hidden = true;
    $about.hidden = false;
    try { Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch {}
  });

  // Назад в меню
  $btnBack.addEventListener('click', () => {
    $about.hidden = true;
    $menu.hidden = false;
  });

  // Заглушка "Играть" — действие добавим на следующем шаге
  $btnPlay.addEventListener('click', () => {
    // Здесь позже подключим старт игры/интро
    // Сейчас просто возвращаем меню, чтобы было предсказуемо
    // alert('Старт игры — добавим на следующем шаге');
  });
});
