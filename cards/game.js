// == ИНИЦИАЛИЗАЦИЯ TELEGRAM (безопасно и вне Telegram) ==
(function initTMA(){
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const scheme = Telegram.WebApp.colorScheme;
      const header = (scheme === 'dark') ? '#000000' : '#ffffff';
      Telegram.WebApp.setHeaderColor?.(header);
    }
  } catch (e) {}
})();

// == АУДИО: короткий "тик" ==
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

// == ОСНОВНОЙ КОД ==
document.addEventListener('DOMContentLoaded', () => {
  // == MINI-BOT ассистент ==
  const miniBot = document.querySelector('.mini-bot');
  const miniBotAvatar = document.querySelector('.mini-bot-avatar');
  function botSay(text) {
    const bubble = document.getElementById("botBubble");
    if (bubble) bubble.textContent = text;
    if (miniBot) {
      if (text && text.trim() !== "") {
        miniBot.style.display = "";
      } else {
        miniBot.style.display = "none";
      }
    }
  }
  // Ассистент приветствует только на первом запуске новой игры
  if (!localStorage.getItem('botSaidHello')) {
    botSay("Отлично! Мы нашли зарядное устройство! Теперь я смогу жить! Давай накопим немного энергии.");
    localStorage.setItem('botSaidHello', '1');
  } else {
    botSay(""); // ассистент скрыт полностью
  }
  // Скрытие ассистента по клику
  if (miniBotAvatar && miniBot) {
    miniBotAvatar.addEventListener('click', function () {
      miniBot.style.display = 'none';
    });
  }

  // == ДОСТИЖЕНИЯ (УНИВЕРСАЛЬНАЯ СИСТЕМА) ==
  const achievements = [
    { id: 1,  text: 'Первая энергия!',           check: (energy, panels) => energy >= 1 },
    { id: 2,  text: '10 энергии!',               check: (energy, panels) => energy >= 10 },
    { id: 3,  text: '50 энергии!',               check: (energy, panels) => energy >= 50 },
    { id: 4,  text: '100 энергии!',              check: (energy, panels) => energy >= 100 },
    { id: 5,  text: '200 энергии!',              check: (energy, panels) => energy >= 200 },
    { id: 6,  text: '500 энергии!',              check: (energy, panels) => energy >= 500 },
    { id: 7,  text: '1000 энергии!',             check: (energy, panels) => energy >= 1000 },
    { id: 8,  text: '1 солнечная панель!',       check: (energy, panels) => panels >= 1 },
    { id: 9,  text: '5 солнечных панелей!',      check: (energy, panels) => panels >= 5 },
    { id: 10, text: '10 солнечных панелей!',     check: (energy, panels) => panels >= 10 },
    // Просто дополняй сюда следующие условия
  ];

  let lastAchievementShownId = null; // Для защиты от повторных появлений

  const achievementBtn = document.getElementById('show-achievement');
  const achievementModal = document.getElementById('achievement-modal');
  const achievementImg = document.getElementById('achievement-img');
  const achievementOk = document.getElementById('achievement-ok');

  // Предзагрузка всех картинок достижений (до 100)
  for (let i = 1; i <= 100; i++) {
    const img = new Image();
    img.src = `images/cards/${String(i).padStart(3, '0')}.jpg`;
  }

  function findUnlockedAchievement() {
    for (const a of achievements) {
      const key = `achievement${a.id}Unlocked`;
      if (!localStorage.getItem(key) && a.check(energy, panels)) {
        return a;
      }
    }
    return null;
  }

  function checkAchievements() {
    // Не показывать кнопку если сейчас открыт модал достижения
    if (achievementModal.classList.contains('hidden')) {
      const unlocked = findUnlockedAchievement();
      if (unlocked && lastAchievementShownId !== unlocked.id) {
        achievementBtn.textContent = '🏆 ' + unlocked.text;
        achievementBtn.classList.remove('hidden');
        lastAchievementShownId = unlocked.id;
      } else if (!unlocked) {
        achievementBtn.classList.add('hidden');
      }
    }
  }

  if (achievementBtn && achievementModal && achievementImg && achievementOk) {
    achievementBtn.onclick = function() {
      const current = findUnlockedAchievement();
      if (!current) return;
      // Показываем модалку с нужной картинкой
      achievementImg.src = `images/cards/${String(current.id).padStart(3, '0')}.jpg`;
      achievementModal.classList.remove('hidden');
      achievementBtn.classList.add('hidden');
      // Сохраняем факт получения достижения
      localStorage.setItem(`achievement${current.id}Unlocked`, '1');
      lastAchievementShownId = null; // Позволяем появиться следующему
    };
    achievementOk.onclick = function() {
      achievementModal.classList.add('hidden');
      checkAchievements(); // Может появиться следующее!
    };
  }

  // == ИГРОВАЯ ЛОГИКА ==
  const maxEnergy = 5000;
  const productionPerPanel = 0.32;
  const priceRatio = 1.12;
  const basePanelCost = 10;
  let energy = 0;
  let panels = 1;
  let lastUpdate = Date.now();

  // --- DOM-элементы ---
  const energyElem = document.getElementById('energy');
  const panelsBtn = document.getElementById('panel-btn');
  const productionElem = document.getElementById('production');
  const popup = document.getElementById('popup');
  const panelCostElem = document.getElementById('panel-cost');
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const notEnoughResources = document.getElementById('not-enough-resources');
  const notEnoughOkBtn = document.getElementById('not-enough-ok');
  let saveExitBtn = document.getElementById('save-exit-btn');
  // Кнопка "Сохранить и выйти" — если нет, добавляем:
  if (!saveExitBtn) {
    saveExitBtn = document.createElement('button');
    saveExitBtn.id = 'save-exit-btn';
    saveExitBtn.textContent = '💾 Сохранить и выйти';
    saveExitBtn.className = 'btn btn-primary';
    const mainContainer = document.getElementById('game') || document.body;
    mainContainer.appendChild(saveExitBtn);
  }
  // --- Функция ПОЛНОГО СБРОСА игры + ассистента ---
  function resetGame() {
    localStorage.removeItem('minirobots-save');
    localStorage.removeItem('botSaidHello');
    // Сбросить все достижения
    for (let i = 1; i <= 100; i++) {
      localStorage.removeItem(`achievement${i}Unlocked`);
    }
    window.location.reload();
  }

  // --- Логика сохранения/загрузки игры ---
  function saveGame() {
    localStorage.setItem('minirobots-save', JSON.stringify({ energy, panels, lastUpdate: Date.now() }));
  }
  function loadGame() {
    const data = localStorage.getItem('minirobots-save');
    if (data) {
      try {
        const state = JSON.parse(data);
        energy = typeof state.energy === 'number' ? state.energy : 0;
        panels = typeof state.panels === 'number' ? state.panels : 1;
        lastUpdate = state.lastUpdate || Date.now();
      } catch {
        lastUpdate = Date.now();
      }
    } else {
      lastUpdate = Date.now();
    }
  }
  function getNextPanelCost() {
    return Math.floor(basePanelCost * Math.pow(priceRatio, panels - 1));
  }
  function updateUI() {
    if (energyElem) energyElem.textContent = energy.toFixed(1);
    if (panelsBtn) panelsBtn.textContent = `☀️ Солнечная панель — ${panels} шт.`;
    if (productionElem) productionElem.textContent = (panels * productionPerPanel).toFixed(2);
    if (panelCostElem) panelCostElem.textContent = getNextPanelCost();
    checkAchievements();
  }
  function gameLoop() {
    const now = Date.now();
    const delta = (now - lastUpdate) / 1000;
    lastUpdate = now;
    if (energy < maxEnergy) {
      energy += panels * productionPerPanel * delta;
      if (energy > maxEnergy) energy = maxEnergy;
      updateUI();
      saveGame();
    }
    requestAnimationFrame(gameLoop);
  }
  // --- ЛОГИКА КНОПОК ---
  if (panelsBtn) panelsBtn.onclick = () => {
    if (popup) popup.style.display = 'block';
    if (notEnoughResources) notEnoughResources.classList.add('hidden');
  };
  if (yesBtn) yesBtn.onclick = () => {
    const cost = getNextPanelCost();
    if (energy >= cost) {
      energy -= cost;
      panels++;
      tick();
      saveGame();
      updateUI();
      if (popup) popup.style.display = 'none';
    } else {
      if (popup) popup.style.display = 'none';
      if (notEnoughResources) notEnoughResources.classList.remove('hidden');
    }
  };
  if (noBtn) noBtn.onclick = () => {
    if (popup) popup.style.display = 'none';
  };
  if (notEnoughOkBtn) notEnoughOkBtn.onclick = () => {
    if (notEnoughResources) notEnoughResources.classList.add('hidden');
  };
  saveExitBtn.onclick = () => {
    saveGame();
    window.location.href = './index.html';
  };
  // --- Горячие клавиши для popup ---
  document.addEventListener('keydown', (e) => {
    if (popup && popup.style.display === 'block') {
      if (e.key === 'Enter') {
        e.preventDefault();
        yesBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        noBtn.click();
      }
    } else if (notEnoughResources && !notEnoughResources.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        notEnoughOkBtn.click();
      }
    }
  });
  // --- Если у тебя есть уже кнопка "Сбросить игру" в меню (например, с id="reset-btn"), нужно сделать так:
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.onclick = resetGame;

  // --- Запуск игры ---
  if (
    energyElem &&
    panelsBtn &&
    productionElem &&
    popup &&
    panelCostElem &&
    yesBtn &&
    noBtn &&
    notEnoughResources &&
    notEnoughOkBtn
  ) {
    loadGame();
    updateUI();
    gameLoop();
  } else {
    console.warn('Некоторые элементы DOM не найдены. Проверьте разметку game.html');
  }
});
