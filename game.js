// == ИНИЦИАЛИЗАЦИЯ TELEGRAM ==
(function initTMA() {
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const scheme = Telegram.WebApp.colorScheme;
      Telegram.WebApp.setHeaderColor?.(scheme === 'dark' ? '#000000' : '#ffffff');
    }
  } catch (e) {}
})();

// == ЗВУКОВОЙ ТИК ==
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tick() {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square'; o.frequency.value = 2200;
  g.gain.value = 0.02;
  o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  o.stop(now + 0.045);
}

document.addEventListener('DOMContentLoaded', () => {
  // === ПАРАМЕТРЫ ИГРЫ ===
  const maxEnergy = 5000;
  const panelProduction = 0.315;
  const priceRatio = 1.12;
  const basePanelCost = 10;
  const baseStationCost = 5;
  const stationPriceRatio = 2.5;
  const robotBuildTime = 40; // сек на робота

  let energy = 0;
  let panels = 1;
  let trees = 0;
  let chargingStations = 0;
  let robots = 0;
  let robotProgress = 0;
  let lastUpdate = Date.now();

  // === DOM ЭЛЕМЕНТЫ ===
// === DOM ЭЛЕМЕНТЫ ===
const energyElem       = document.getElementById('energy');
const productionElem   = document.getElementById('production');
const panelsCountElem  = document.getElementById('panels-count');
const panelCostElem    = document.getElementById('panel-cost');
const panelBtn         = document.getElementById('panel-btn');
const treeBtn          = document.getElementById('tree-btn');
const treesCountElem   = document.getElementById('trees-count');
const treesContainer   = document.getElementById('trees-container');
const stationBtn       = document.getElementById('charging-station-btn');
const robotCont        = document.getElementById('robots-container');
const robotsCountElem  = document.getElementById('robots-count');
const maxRobotsElem    = document.getElementById('max-robots');
const robProgCont      = document.getElementById('robot-progress-container');
const robProgBar       = document.getElementById('robot-progress-bar');

// === ФУНКЦИИ РАСЧЁТОВ ===
function getNextPanelCost() {
  return Math.floor(basePanelCost * Math.pow(priceRatio, panels - 1));
}

function getNextStationCost() {
  return Math.floor(baseStationCost * Math.pow(stationPriceRatio, chargingStations));
}

function getMaxRobots() {
  return chargingStations * 2;
}

// === СОХРАНЕНИЕ/ЗАГРУЗКА ===
function saveGame() {
  localStorage.setItem('minirobots-save', JSON.stringify({
    energy,
    panels,
    trees,
    chargingStations,
    robots,
    robotProgress,
    lastUpdate: Date.now()
  }));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem('minirobots-save') || '{}');
  energy           = typeof data.energy === 'number' ? data.energy : 0;
  panels           = typeof data.panels === 'number' ? data.panels : 1;
  trees            = typeof data.trees === 'number' ? data.trees : 0;
  chargingStations = typeof data.chargingStations === 'number' ? data.chargingStations : 0;
  robots           = typeof data.robots === 'number' ? data.robots : 0;
  robotProgress    = typeof data.robotProgress === 'number' ? data.robotProgress : 0;
  lastUpdate       = data.lastUpdate || Date.now();
}


  // === ОБНОВЛЕНИЕ UI ===
  function updateUI() {
    // Энергия и производство
    energyElem.textContent = energy.toFixed(1);
    productionElem.textContent = (panels * panelProduction).toFixed(2);

    // Панели
    panelsCountElem.textContent = panels;
    panelCostElem.textContent = getNextPanelCost();

    // Кнопка рубки дерева: показываем только при энергии ≥ 30
if (treeBtn) {
  treeBtn.style.display = energy >= 30 ? '' : 'none';
}


    // Станции
    stationBtn.style.display = trees >= 1 ? '' : 'none';
    stationBtn.textContent = `🔋 Построить зарядную станцию (${chargingStations}) — ${getNextStationCost()}🌳`;

    // Роботы
    robotCont.style.display = (robots > 0 || chargingStations > 0) ? '' : 'none';
    robotsCountElem.textContent = Math.floor(robots);
    maxRobotsElem.textContent = getMaxRobots();
  }

  // === ОСНОВНОЙ ЦИКЛ ===
  function gameLoop() {
    const now = Date.now();
    const delta = (now - lastUpdate) / 1000;
    lastUpdate = now;

    // Производство энергии панелями
    if (energy < maxEnergy) {
      energy += panels * panelProduction * delta;
      if (energy > maxEnergy) energy = maxEnergy;
    }

    // Прогресс-бар робота
    if (chargingStations > 0 && robots < getMaxRobots()) {
      robotProgress += delta / robotBuildTime;
      robProgCont.classList.remove('hidden');
      if (robotProgress >= 1) {
        robots++;
        robotProgress -= 1;
        tick();
      }
      robProgBar.style.width = `${Math.min(robotProgress, 1) * 100}%`;
    } else {
      robotProgress = 0;
      robProgBar.style.width = '0%';
      robProgCont.classList.add('hidden');
    }

    // Потребление энергии роботами
    if (robots >= 1) {
      energy = Math.max(0, energy - robots * 2 * delta);
    }

    updateUI();
    saveGame();
    requestAnimationFrame(gameLoop);
  }

  // === ОБРАБОТЧИКИ КНОПОК ===
  panelBtn.onclick = () => {
    const cost = getNextPanelCost();
    if (energy >= cost) {
      energy -= cost;
      panels++;
      tick();
      saveGame();
      updateUI();
    } else {
      alert('Недостаточно энергии для панели!');
    }
  };
  treeBtn.onclick = () => {
  if (energy >= 100) {
    energy -= 100;
    trees++;
    tick();
    saveGame();
    updateUI();
  } else {
    alert('Недостаточно энергии для дерева!');
  }
};

stationBtn.onclick = () => {
  const cost = getNextStationCost();
  if (trees >= cost) {
    trees -= cost;
    chargingStations++;
    tick();
    saveGame();
    updateUI();
  } else {
    alert('Недостаточно дерева для станции!');
  }
};


  // === ЗАПУСК ===
  loadGame();
  updateUI();
  gameLoop();
});
