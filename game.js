document.addEventListener('DOMContentLoaded', () => {
  const maxEnergy = 5000;
  const productionPerPanel = 0.32;
  const priceRatio = 1.12;
  const basePanelCost = 10;

  let energy = 0;
  let panels = 1;
  let lastUpdate = Date.now();

  const energyElem = document.getElementById('energy');
  const panelsBtn = document.getElementById('panel-btn');
  const productionElem = document.getElementById('production');
  const popup = document.getElementById('popup');
  const panelCostElem = document.getElementById('panel-cost');
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');

  const notEnoughResources = document.getElementById('not-enough-resources');
  const notEnoughOkBtn = document.getElementById('not-enough-ok');

  // Создаем и добавляем кнопку "Сохранить и выйти", если нет в HTML
  let saveExitBtn = document.getElementById('save-exit-btn');
  if (!saveExitBtn) {
    saveExitBtn = document.createElement('button');
    saveExitBtn.id = 'save-exit-btn';
    saveExitBtn.textContent = '💾 Сохранить и выйти';
    saveExitBtn.className = 'btn btn-primary';
    const mainContainer = document.getElementById('game') || document.body;
    mainContainer.appendChild(saveExitBtn);
  }

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

  if (panelsBtn) panelsBtn.onclick = () => {
    if (popup) popup.style.display = 'block';
    if (notEnoughResources) notEnoughResources.classList.add('hidden');
  };

  if (yesBtn) yesBtn.onclick = () => {
    const cost = getNextPanelCost();
    if (energy >= cost) {
      energy -= cost;
      panels++;
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
    window.location.href = './index.html'; // Выход в меню
  };

  // Обработка клавиш Enter/Esc для покупки и окна предупреждения
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
