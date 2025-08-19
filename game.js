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
  // --- MINI-BOT ассистент ---
  const miniBot = document.querySelector('.mini-bot');
  const miniBotAvatar = document.querySelector('.mini-bot-avatar');
  // Предзагрузка картинки достижения
  const preloadedAchievementImage = new Image();
preloadedAchievementImage.src = 'images/cards/001.jpg';

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
  // ==== ДОСТИЖЕНИЕ ====
  const achievementBtn = document.getElementById('show-achievement');
  const achievementModal = document.getElementById('achievement-modal');
  const achievementImg = document.getElementById('achievement-img');
  const achievementOk = document.getElementById('achievement-ok');
  let achievmentShown = false;

  function checkAchievement() {
    if (!achievmentShown && energy >= 1) {
      achievementBtn.classList.remove('hidden');
    }
  }

  achievementBtn.onclick = function() {
    achievementModal.classList.remove('hidden');
    // achievementImg.src = "images/cards/001.jpg"; // если захочешь менять из JS
    achievementBtn.classList.add('hidden');
    achievmentShown = true;
  };

  achievementOk.onclick = function() {
    achievementModal.classList.add('hidden');
  };

  // Впиши запуск чекера в updateUI, чтобы кнопка появлялась вовремя:
  const originalUpdateUI = updateUI;
  updateUI = function() {
    originalUpdateUI();
    checkAchievement();
  };


  // --- ИГРОВАЯ ЛОГИКА ---
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
    localStorage.removeItem('botSaidHello'); // <<<<< сбрасываем ассистента!
    window.location.reload();
  }

  // --- Пример добавления кнопки "Сбросить игру" (если хотите в интерфейс) ---
  // Если нужна отдельная кнопка/элемент:
  // const resetBtn = document.createElement('button');
  // resetBtn.textContent = '🔄 Сбросить игру';
  // resetBtn.className = 'btn btn-secondary';
  // resetBtn.onclick = resetGame;
  // mainContainer.appendChild(resetBtn);

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

  // --- Если у тебя есть уже кнопка "Сбросить игру" в меню (например, с id="reset-btn"), нужно сделать так:
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.onclick = resetGame;
});
  // ==== ДОСТИЖЕНИЕ ====
  // Считаем, что "achievement1Unlocked" — ключ достижения №1
  let achievement1Unlocked = localStorage.getItem('achievement1Unlocked') === '1';

  const achievementBtn = document.getElementById('show-achievement');
  const achievementModal = document.getElementById('achievement-modal');
  const achievementImg = document.getElementById('achievement-img');
  const achievementOk = document.getElementById('achievement-ok');

  // Скрываем кнопку, если ранее уже было получено
  if (achievement1Unlocked) {
    achievementBtn.classList.add('hidden');
  }

  function checkAchievement() {
    if (!achievement1Unlocked && energy >= 1) {
      achievementBtn.classList.remove('hidden');
    }
  }

  if (achievementBtn && achievementModal && achievementOk) {
    achievementBtn.onclick = function() {
      achievementModal.classList.remove('hidden');
      achievementBtn.classList.add('hidden');
      achievement1Unlocked = true;
      localStorage.setItem('achievement1Unlocked', '1');
    };

    achievementOk.onclick = function() {
      achievementModal.classList.add('hidden');
    };
  }

  // Вставь вызов checkAchievement в конец функции updateUI, чтобы оно проверялось каждый апдейт:
  const originalUpdateUI = updateUI;
  updateUI = function() {
    originalUpdateUI();
    checkAchievement();
  };

