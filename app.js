// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const $menu = document.getElementById('menu');
  const $about = document.getElementById('about');

  const $btnPlay = document.getElementById('btn-play');
  const $btnAbout = document.getElementById('btn-about');
  const $btnBack = document.getElementById('btn-back');

  // Переход в экран "Об игре"
  $btnAbout.addEventListener('click', () => {
    $menu.hidden = true;
    $about.hidden = false;
    // Небольшая вибрация (когда будем подключать TMA-хаптик)
    // try { Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
  });

  // Возврат в меню
  $btnBack.addEventListener('click', () => {
    $about.hidden = true;
    $menu.hidden = false;
  });

  // Заглушка "Играть" — действие добавим на следующем шаге
  $btnPlay.addEventListener('click', () => {
    // Здесь позже: запуск интро/игры
    // alert('Старт игры (в следующем шаге подключим)');
  });
});

