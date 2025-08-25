// == ИНИЦИАЛИЗАЦИЯ TELEGRAM ==
(function initTMA() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            const scheme = Telegram.WebApp.colorScheme;
            Telegram.WebApp.setHeaderColor?.(scheme === 'dark' ? '#1f2028' : '#ffffff');
        }
    } catch (e) {}
})();

// == ЗВУКОВОЙ ТИК ==
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
// == ФУНКЦИЯ ПОЛНОГО СБРОСА ИГРЫ ==
function resetGame() {
    console.log('resetGame вызвана');
    try {
        localStorage.removeItem('minirobots-save');
        localStorage.removeItem('shownAssistant');
        window.location.reload(true);
    } catch (error) {
        console.error('Ошибка при сбросе игры:', error);
        window.location.reload(true);
    }
}

// Показывает подтверждение сброса и вызывает resetGame()
function showResetConfirm() {
    const confirmed = confirm('Вы уверены, что хотите полностью сбросить игру и потерять весь прогресс?');
    if (confirmed) {
        resetGame();
    }
}

// === КОНСТАНТЫ ИГРЫ ===
const MAX_ENERGY = 5000;
const PANEL_PRODUCTION = 0.63;
const PRICE_RATIO = 1.12;
const BASE_PANEL_COST = 10;
const BASE_STATION_COST = 5;
const STATION_PRICE_RATIO = 2.5;
const ROBOT_BUILD_TIME = 40;
const MAX_TREES = 200;
const LUMBERJACK_PRODUCTION = 0.09;
const SCIENTIST_PRODUCTION = 0.175;
const LAB_COST_BASE = 25;
const LAB_COST_RATIO = 1.15;
const LAB_KNOWLEDGE_BONUS = 0.10;
const FIRST_LAB_CAPACITY = 500;
const ADDITIONAL_LAB_CAPACITY = 250;

// === КОНСТАНТЫ ПОГОДЫ ===
const WEATHER_TYPES = {
    SUNNY: 'sunny',
    CLOUDY: 'cloudy',
    RAINY: 'rainy'
};

const WEATHER_PRODUCTION_RATES = {
    [WEATHER_TYPES.SUNNY]: 0.945,
    [WEATHER_TYPES.CLOUDY]: 0.63,
    [WEATHER_TYPES.RAINY]: 0.315
};

const MIN_WEATHER_DURATION = 1 * 60 * 60;
const MAX_WEATHER_DURATION = 6 * 60 * 60;

// === ИГРОВЫЕ ПЕРЕМЕННЫЕ ===
let energy = 0;
let panels = 1;
let trees = 0;
let chargingStations = 0;
let robots = 0;
let robotProgress = 0;
let lastUpdate = Date.now();
let treeButtonUnlocked = false;
let labUnlocked = false;
let freeRobots = 0;
let lumberjackRobots = 0;
let laboratories = 0;
let knowledge = 0;
let maxKnowledge = 0;
let scientistRobots = 0;

// === ПЕРЕМЕННЫЕ ПОГОДЫ ===
let currentWeather = WEATHER_TYPES.SUNNY;
let weatherTimeRemaining = 0;
let forecastWeather = null;
let forecastChangeTime = null;

// === ПЕРЕМЕННЫЕ НАВИГАЦИИ ===
let currentPanel = 'main';

// === DOM ЭЛЕМЕНТЫ ===
const energyTextElem = document.getElementById('energy-text');
const panelsCountElem = document.getElementById('panels-count');
const panelCostElem = document.getElementById('panel-cost');
const panelBtn = document.getElementById('panel-btn');
const treeBtn = document.getElementById('tree-btn');
const treesCountElem = document.getElementById('trees-count');
const robotsCountElem = document.getElementById('robots-count');
const maxRobotsElem = document.getElementById('max-robots');
const robProgCont = document.getElementById('robot-progress-container');
const robProgBar = document.getElementById('robot-progress-bar');
const btnExit = document.getElementById('btn-exit');
const knowledgeText = document.getElementById('knowledge-text');

document.addEventListener('DOMContentLoaded', () => {
  // === МЕНЮ СНОСА ===
  const demolishMenu = document.getElementById('demolish-menu');
  let currentDemolishType = null;

  // Показать меню — авторазмещение по экрану
  function showDemolishMenu(buttonElem, type) {
    currentDemolishType = type;
    // Сначала показываем меню "невидимо", чтобы узнать размеры
    demolishMenu.classList.remove('hidden');
    demolishMenu.style.visibility = 'hidden';
    demolishMenu.style.position = 'absolute';

    const rect = buttonElem.getBoundingClientRect();
    const menuWidth = demolishMenu.offsetWidth;
    const menuHeight = demolishMenu.offsetHeight;
    const padding = 8;

    // По умолчанию располагаем слева от кнопки
    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX - menuWidth - padding;

    // Если слева не помещается — показываем справа от кнопки
    if (left < 0) {
      left = rect.right + window.scrollX + padding;
      // Если меню вылезает за правый край — двигаем к правому краю окна
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - padding;
      }
    }

    // По вертикали не позволяем меню вылезти за низ
    if (top + menuHeight > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - menuHeight - padding;
    }
    if (top < padding) top = padding;

    demolishMenu.style.top = `${top}px`;
    demolishMenu.style.left = `${left}px`;
    demolishMenu.style.visibility = 'visible';
  }

  // Скрыть меню
  function hideDemolishMenu() {
    demolishMenu.classList.add('hidden');
    currentDemolishType = null;
  }

  // Удалить здание по типу
  function demolishBuilding(type) {
    switch(type) {
      case 'panel':
        if (typeof panels !== 'undefined' && panels > 0) panels--;
        break;
      case 'station':
        if (typeof chargingStations !== 'undefined' && chargingStations > 0) chargingStations--;
        break;
      case 'laboratory':
        if (typeof laboratories !== 'undefined' && laboratories > 0) laboratories--;
        break;
    }
    if (typeof saveGame === 'function') saveGame();
    if (typeof updateUI === 'function') updateUI();
  }

  // Обработчики кнопок ❎
  document.querySelectorAll('.demolish-btn').forEach(btn => {
    btn.addEventListener('click', event => {
      const type = btn.getAttribute('data-type');
      showDemolishMenu(btn, type);
      event.stopPropagation();
    });
  });

  // Кнопка “Да”
  const demolishYesBtn = document.getElementById('demolish-yes');
  if (demolishYesBtn) {
    demolishYesBtn.addEventListener('click', () => {
      demolishBuilding(currentDemolishType);
      hideDemolishMenu();
    });
  }

  // Кнопка “Нет”
  const demolishNoBtn = document.getElementById('demolish-no');
  if (demolishNoBtn) {
    demolishNoBtn.addEventListener('click', () => {
      hideDemolishMenu();
    });
  }

  // Скрываем меню при клике вне его
  document.addEventListener('click', event => {
    if (demolishMenu && !demolishMenu.contains(event.target) && !event.target.classList.contains('demolish-btn')) {
      hideDemolishMenu();
    }
  });
});


// === ФУНКЦИИ ПОГОДЫ ===
function getWeatherDisplayName(weatherType) {
    const names = {
        [WEATHER_TYPES.SUNNY]: 'Солнечно',
        [WEATHER_TYPES.CLOUDY]: 'Облачно',
        [WEATHER_TYPES.RAINY]: 'Дождь'
    };
    return names[weatherType] || 'Неизвестно';
}

function getCurrentPanelProduction() {
    return WEATHER_PRODUCTION_RATES[currentWeather] || PANEL_PRODUCTION;
}

function generateRandomWeatherDuration() {
    return MIN_WEATHER_DURATION + Math.random() * (MAX_WEATHER_DURATION - MIN_WEATHER_DURATION);
}

function changeWeather() {
    const weatherOptions = Object.values(WEATHER_TYPES);
    const availableWeathers = weatherOptions.filter(w => w !== currentWeather);
    currentWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
    weatherTimeRemaining = generateRandomWeatherDuration();
}

// === ФУНКЦИЯ ГЕНЕРАЦИИ ПРОГНОЗА ===
function generateForecast() {
    const options = Object.values(WEATHER_TYPES).filter(w => w !== currentWeather);
    const nextWeather = options[Math.floor(Math.random() * options.length)];
    const intervalSec = weatherTimeRemaining + generateRandomWeatherDuration();
    forecastChangeTime = Date.now() + intervalSec * 1000;
    forecastWeather = nextWeather;

    const saved = JSON.parse(localStorage.getItem('minirobots-save') || '{}');
    saved.forecastWeather = forecastWeather;
    saved.forecastChangeTime = forecastChangeTime;
    localStorage.setItem('minirobots-save', JSON.stringify(saved));
}

function formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}ч ${minutes}м ${secs}с`;
}

// === ФУНКЦИИ НАВИГАЦИИ ===
function showPanel(panelName) {
    const panels = ['main-panel', 'robots-panel', 'knowledge-panel', 'weather-panel'];
    panels.forEach(p => {
        const elem = document.getElementById(p);
        if (elem) elem.classList.add('hidden');
    });
    const targetPanel = document.getElementById(panelName + '-panel');
    if (targetPanel) targetPanel.classList.remove('hidden');
    currentPanel = panelName;
}

// === ТЕКСТОВЫЙ ПОМОЩНИК ===
const assistantMessages = [
    { id: 'energy-0.1', threshold: { energy: 0.1 }, text: ['Вы - последний уцелевший робот после апокалипсиса. Вы должны были погибнуть в огне, но случайно нашли солнечную панель и теперь заряжаетесь.'] },
    { id: 'energy-10', threshold: { energy: 10 }, text: ['Вы можете собрать из обломков еще одну солнечную панель. Нажмите кнопку ☀️ ниже. Зарядка пойдет быстрее.'] },
    { id: 'energy-20', threshold: { energy: 100 }, text: ['Чем больше панелей из обломков вы собрали, тем сложнее находить новые запчасти. Тем больше энергии вы тратите на то, чтобы построить еще одну солнечную панель. В конце концов это все окупится стократно.'] },
    { id: 'energy-30', threshold: { energy: 30 }, text: ['Поблизости есть лес. Теперь, если вы будете достаточно заряжены - можете рубить дерево. Оно потребуется нам в дальнейшем.'] },
    { id: 'panels-20', threshold: { panels: 20 }, text: ['20 солнечных панелей. Настало время рассказать о погоде. В зависимости о погодных условий одна панель приносит примерно от 0,3⚡/сек в дождь, до 1⚡/сек в ясную погоду. Нужно учитывать это при постройке роботов. Небо затянется тучами - питания не хватит и роботы отключатся.'] },
    { id: 'trees-3', threshold: { trees: 3 }, text: ['Зарядные станции позволяют строить новых роботов. ⚠️ Не стройте зарядную станцию, если не добываете 8⚡ в секунду. Вашим роботам не хватит энергии и они отключатся, а их сознание сотрется. Это для них равносильно смерти 💀. '] },
    { id: 'trees-4', threshold: { trees: 4 }, text: ['Каждая зарядная станция позволит собрать двух роботов. Каждый будет потреблять 4⚡ в секунду. Если ваши панели уже вырабатывают 8⚡ то это то, что вам нужно.'] },
    { id: 'chargingStations-1', threshold: { chargingStations: 1 }, text: ['Площадка для зарядки - маленький домик, где мы сможем собрать из обломков двух роботов, которые будут помогать. Как только вы построили площадку, начинается сборка роботов. Следите, чтобы роботам хватало питания, по 4⚡ каждому! Это очень важно.'] },
    { id: 'robots-1', threshold: { robots: 1 }, text: ['Перый мини-робот открыл глаза. Вы можете отправить его на рубку леса.🪓 Откройте для этого вкладку "Роботы"'] },
    { id: 'robots-2', threshold: { robots: 2 }, text: ['Готов второй робот. Вы можете назначить его ученым, когда у вас будет лаборатория. '] },
    { id: 'chargingStations-2', threshold: { chargingStations: 2 }, text: ['Игра не останавливается никогда. Даже если вы закроете страницу и выключите телефон. Солнечные панели продолжают накапливать энергию, роботы продолжают работать непрерывно, пока им хватает энергии ⚡⚡'] },
    { id: 'trees-10', threshold: { trees: 10 }, text: ['Теперь вам доступна постройка лаборатории. Но вам придется нарубить на нее 25 🌳. Лаборатории позволят вам накапливать знания и развивать новые технологии.'] },
    { id: 'laboratories-1', threshold: { laboratories: 1 }, text: ['Вы построили первую лабораторию! Теперь можете назначать роботов учёными для производства знаний. Каждая лаборатория увеличивает эффективность производства знаний на 10%.'] },
    { id: 'knowledge-50', threshold: { knowledge: 50 }, text: ['Ваши учёные накапливают знания! Знания - это основа для будущих технологических открытий. Продолжайте строить лаборатории и назначать учёных для ускорения исследований.'] }
];

const assistantQueue = [];
let assistantBusy = false;

function checkAssistant() {
    const shown = JSON.parse(localStorage.getItem('shownAssistant') || '[]');
    const ctx = { panels, trees, energy, chargingStations, robots, laboratories, knowledge };
    const nextMsg = assistantMessages.find(msg => 
        !shown.includes(msg.id) &&
        Object.entries(msg.threshold).every(([key, val]) => ctx[key] >= val)
    );
    if (nextMsg) {
        shown.push(nextMsg.id);
        localStorage.setItem('shownAssistant', JSON.stringify(shown));
        enqueueAssistant(nextMsg.text);
    }
}

function enqueueAssistant(lines) {
    if (!Array.isArray(lines)) return;
    lines.forEach(line => assistantQueue.push(line));
    if (!assistantBusy) processAssistantQueue();
}

async function processAssistantQueue() {
    if (assistantBusy) return;
    const nextLine = assistantQueue.shift();
    if (nextLine === undefined) return;
    assistantBusy = true;
    try {
        await new Promise(resolve => {
            showAssistant([nextLine]);
            const textElem = document.getElementById('assistant-text');
            if (textElem) {
                const observer = new MutationObserver((_, obs) => {
                    if (!textElem.textContent.endsWith('_')) {
                        obs.disconnect();
                        resolve();
                    }
                });
                observer.observe(textElem, { childList: true, characterData: true, subtree: true });
            } else {
                resolve();
            }
        });
    } finally {
        assistantBusy = false;
        if (assistantQueue.length > 0) {
            processAssistantQueue();
        }
    }
}

function showAssistant(lines) {
    const panel = document.getElementById('assistant-panel');
    const text = document.getElementById('assistant-text');
    if (panel && text) {
        panel.classList.remove('hidden');
        typeAssistant(lines, text, 54);
        panel.onclick = function () {
            panel.classList.add('hidden');
            text.textContent = '';
        };
    }
}

function typeAssistant(lines, elem, speed = 50, callback) {
    let i = 0;
    function nextLine() {
        if (i >= lines.length) {
            if (callback) callback();
            return;
        }
        const line = lines[i++] || '';
        let pos = 0;
        elem.textContent = '';
        function step() {
            if (pos <= line.length) {
                elem.textContent = line.slice(0, pos) + '_';
                const ch = line.charAt(pos - 1);
                if (ch && ch !== ' ' && ch !== '\n' && ch !== '\t') tick();
                pos++;
                setTimeout(step, speed);
            } else {
                elem.textContent = line;
                setTimeout(nextLine, speed * 5);
            }
        }
        step();
    }
    nextLine();
}

// === ФУНКЦИИ РАСЧЁТОВ ===
function getNextPanelCost() {
    return Math.floor(BASE_PANEL_COST * Math.pow(PRICE_RATIO, panels - 1));
}

function getNextStationCost() {
    return Math.floor(BASE_STATION_COST * Math.pow(STATION_PRICE_RATIO, chargingStations));
}

function getNextLaboratoryCost() {
    return Math.floor(LAB_COST_BASE * Math.pow(LAB_COST_RATIO, laboratories));
}

function getMaxRobots() {
    return chargingStations * 2;
}

function getMaxScientists() {
    return laboratories;
}

function calculateMaxKnowledge() {
    if (laboratories === 0) return 0;
    return FIRST_LAB_CAPACITY + (laboratories - 1) * ADDITIONAL_LAB_CAPACITY;
}

function getKnowledgeProductionBonus() {
    return 1 + (laboratories * LAB_KNOWLEDGE_BONUS);
}

// === СОХРАНЕНИЕ/ЗАГРУЗКА ===
function saveGame() {
    const gameData = {
        energy: energy,
        panels: panels,
        trees: trees,
        chargingStations: chargingStations,
        robots: robots,
        robotProgress: robotProgress,
        lastUpdate: Date.now(),
        treeButtonUnlocked: treeButtonUnlocked,
        freeRobots: freeRobots,
        lumberjackRobots: lumberjackRobots,
        laboratories: laboratories,
        knowledge: knowledge,
        maxKnowledge: maxKnowledge,
        scientistRobots: scientistRobots,
        currentWeather: currentWeather,
        weatherTimeRemaining: weatherTimeRemaining,
        forecastWeather: forecastWeather,
        forecastChangeTime: forecastChangeTime
    };
    localStorage.setItem('minirobots-save', JSON.stringify(gameData));
}

function loadGame() {
    try {
        const savedData = localStorage.getItem('minirobots-save');
        if (!savedData) {
    energy = 0;
    panels = 1;
    trees = 0;
    chargingStations = 0;
    robots = 0;
    robotProgress = 0;
    lastUpdate = Date.now();
    treeButtonUnlocked = false;
    freeRobots = 0;
    lumberjackRobots = 0;
    laboratories = 0;
    knowledge = 0;
    scientistRobots = 0;
    maxKnowledge = 0;
    if (!savedData) {
    // ...инициализация всех игровых переменных...
    // Случайная начальная погода
    const weatherOptions = Object.values(WEATHER_TYPES);
    currentWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    weatherTimeRemaining = generateRandomWeatherDuration();
    forecastWeather = null;
    forecastChangeTime = null;
    return;
}
}


        const data = JSON.parse(savedData);
        energy = data.energy || 0;
        panels = data.panels || 1;
        trees = data.trees || 0;
        chargingStations = data.chargingStations || 0;
        robots = data.robots || 0;
        robotProgress = data.robotProgress || 0;
        lastUpdate = data.lastUpdate || Date.now();
        treeButtonUnlocked = data.treeButtonUnlocked || false;
        labUnlocked = false; // сброс разблокировки лаборатории при загрузке
        freeRobots = data.freeRobots || 0;
        lumberjackRobots = data.lumberjackRobots || 0;
        laboratories = data.laboratories || 0;
        knowledge = data.knowledge || 0;
        scientistRobots = data.scientistRobots || 0;
        maxKnowledge = calculateMaxKnowledge();
        currentWeather = data.currentWeather || WEATHER_TYPES.SUNNY;
        weatherTimeRemaining = data.weatherTimeRemaining || generateRandomWeatherDuration();
        forecastWeather = data.forecastWeather || null;
        forecastChangeTime = data.forecastChangeTime || null;

        if (data.freeRobots === undefined && data.lumberjackRobots === undefined && robots > 0) {
            freeRobots = robots;
            lumberjackRobots = 0;
            scientistRobots = 0;
        }
    } catch (e) {
        energy = 0;
        panels = 1;
        trees = 0;
        chargingStations = 0;
        robots = 0;
        robotProgress = 0;
        lastUpdate = Date.now();
        treeButtonUnlocked = false;
        freeRobots = 0;
        lumberjackRobots = 0;
        laboratories = 0;
        knowledge = 0;
        scientistRobots = 0;
        maxKnowledge = 0;
        currentWeather = WEATHER_TYPES.SUNNY;
        weatherTimeRemaining = generateRandomWeatherDuration();
        forecastWeather = null;
        forecastChangeTime = null;
    }
}

// === ОБНОВЛЕНИЕ UI ===
function updateUI() {
    if (energyTextElem) {
        const cur = Math.floor(energy);
        const totalProduction = panels * getCurrentPanelProduction();
        const robotConsumption = robots * 4;
        const netProduction = totalProduction - robotConsumption;
        energyTextElem.textContent = `${cur} / ${MAX_ENERGY} (${netProduction.toFixed(2)}/сек)`;
    }

    if (treesCountElem) {
        const treeProduction = lumberjackRobots * LUMBERJACK_PRODUCTION;
        treesCountElem.textContent = `${Math.floor(trees)} / ${MAX_TREES}`;
        let treeProductionElem = document.getElementById('tree-production');
        if (treeProductionElem) {
            treeProductionElem.textContent = ` (${treeProduction.toFixed(2)}/сек)`;
        }
    }

    maxKnowledge = calculateMaxKnowledge();
    if (knowledgeText) {
        if (laboratories > 0) {
            const knowledgeProduction = scientistRobots * SCIENTIST_PRODUCTION * getKnowledgeProductionBonus();
            knowledgeText.textContent = `${Math.floor(knowledge)} / ${maxKnowledge} (${knowledgeProduction.toFixed(2)}/сек)`;
        } else {
            knowledgeText.textContent = '0 / 0 (0.00/сек)';
        }
    }

    if (panelsCountElem) {
        panelsCountElem.textContent = panels;
    }

    if (panelCostElem) {
        panelCostElem.textContent = getNextPanelCost();
    }

    const panelProductionElem = document.getElementById('panel-production');
    if (panelProductionElem) {
        panelProductionElem.textContent = getCurrentPanelProduction().toFixed(2);
    }

    // Текущая погода
const weatherInfoElem = document.getElementById('weather-info');
if (weatherInfoElem) {
    const currentProduction = getCurrentPanelProduction();
    const baseProduction = PANEL_PRODUCTION;
    const percentage = Math.round((currentProduction / baseProduction) * 100);
    weatherInfoElem.textContent = `${getWeatherDisplayName(currentWeather)} — ${currentProduction.toFixed(2)}/сек (${percentage}%)`;
}


    // Прогноз погоды
    const forecastTextElem = document.getElementById('weather-forecast-text');
    if (forecastTextElem && forecastWeather && forecastChangeTime) {
        const date = new Date(forecastChangeTime);
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const displayName = getWeatherDisplayName(forecastWeather);
        forecastTextElem.textContent = `Будет ${displayName.toLowerCase()} в ${h}:${m}`;
    }

// Блок отображения и обновления лабораторий – заменить полностью
const laboratoryContainer = document.getElementById('laboratory-container');
if (laboratoryContainer) {
    // Если срублено >=10 деревьев, разблокируем лабораторию
    if (!labUnlocked && trees >= 10) {
        labUnlocked = true;
    }
    // После разблокировки всегда показываем контейнер
    if (labUnlocked) {
        laboratoryContainer.style.display = 'flex';
    }
}


    const laboratoriesCountElem = document.getElementById('laboratories-count');
    const laboratoryCostElem = document.getElementById('laboratory-cost');
    const labKnowledgeBonusElem = document.getElementById('lab-knowledge-bonus');
    if (laboratoriesCountElem) {
        laboratoriesCountElem.textContent = laboratories;
    }
    if (laboratoryCostElem) {
        laboratoryCostElem.textContent = getNextLaboratoryCost();
    }
    if (labKnowledgeBonusElem) {
        labKnowledgeBonusElem.textContent = laboratories === 0 ? FIRST_LAB_CAPACITY.toString() : ADDITIONAL_LAB_CAPACITY.toString();
    }

    const knowledgeNavBtn = document.getElementById('knowledge-nav-btn');
    const robotsNavBtn = document.getElementById('robots-nav-btn');
    const weatherNavBtn = document.getElementById('weather-nav-btn');
    if (knowledgeNavBtn) {
        knowledgeNavBtn.style.display = laboratories > 0 ? 'flex' : 'none';
    }
    if (robotsNavBtn) {
        robotsNavBtn.style.display = robots > 0 ? 'flex' : 'none';
    }
    if (weatherNavBtn) {
        weatherNavBtn.style.display = 'flex';
    }

    // Блок отображения кнопки "Рубить дерево"
    if (treeBtn) {
        if (energy >= 30) {
            treeButtonUnlocked = true;
        }
        treeBtn.style.display = treeButtonUnlocked ? 'flex' : 'none';
    }

    // Блок отображения зарядных станций
    const stationContainer = document.getElementById('charging-station-container');
    if (stationContainer) {
        stationContainer.style.display = trees >= 3 ? 'flex' : 'none';
    }

    const stationsCountSpan = document.getElementById('stations-count');
    const stationCostSpan = document.getElementById('station-cost');
    if (stationsCountSpan) {
        stationsCountSpan.textContent = chargingStations;
    }
    if (stationCostSpan) {
        stationCostSpan.textContent = getNextStationCost();
    }

    // Обновление счётчика роботов
    if (robotsCountElem) {
        robotsCountElem.textContent = Math.floor(robots);
    }
    if (maxRobotsElem) {
        maxRobotsElem.textContent = ` / ${getMaxRobots()}`;
    }

    // Прогресс сборки робота
    if (robProgCont) {
        if (chargingStations > 0 && robots < getMaxRobots()) {
            robProgCont.classList.remove('hidden');
        } else {
            robProgCont.classList.add('hidden');
        }
    }
}


// === ОСНОВНОЙ ЦИКЛ ===
function gameLoop() {
    const now = Date.now();
    const delta = (now - lastUpdate) / 1000;
    lastUpdate = now;

    weatherTimeRemaining -= delta;
    if (weatherTimeRemaining <= 0) {
        changeWeather();
        generateForecast();
    }

    const totalProduction = panels * getCurrentPanelProduction();
    const robotConsumption = robots * 4;
    const netEnergyChange = totalProduction - robotConsumption;

    if (energy < MAX_ENERGY && netEnergyChange > 0) {
        energy += netEnergyChange * delta;
        if (energy > MAX_ENERGY) energy = MAX_ENERGY;
    } else if (netEnergyChange < 0) {
        energy += netEnergyChange * delta;
        if (energy < 0) energy = 0;
    }

    if (energy <= 0 && robots > 0) {
        if (scientistRobots > 0) {
            scientistRobots--;
        } else if (lumberjackRobots > 0) {
            lumberjackRobots--;
        } else if (freeRobots > 0) {
            freeRobots--;
        }
        robots--;
        robotProgress = 0;
        tick();
        alert('Энергия истощена! Один из роботов отключен.');
    }

    if (chargingStations > 0 && robots < getMaxRobots()) {
        robotProgress += delta / ROBOT_BUILD_TIME;
        if (robProgBar) {
            robProgBar.style.width = `${Math.min(robotProgress, 1) * 100}%`;
        }
        if (robotProgress >= 1) {
            robots++;
            freeRobots++;
            robotProgress = 0;
            tick();
        }
    } else {
        robotProgress = 0;
        if (robProgBar) {
            robProgBar.style.width = '0%';
        }
    }

    if (lumberjackRobots > 0 && trees < MAX_TREES) {
        const treeGain = lumberjackRobots * LUMBERJACK_PRODUCTION * delta;
        trees += treeGain;
        if (trees > MAX_TREES) trees = MAX_TREES;
    }

    if (scientistRobots > 0 && knowledge < maxKnowledge) {
        const knowledgeGain = scientistRobots * SCIENTIST_PRODUCTION * getKnowledgeProductionBonus() * delta;
        knowledge += knowledgeGain;
        if (knowledge > maxKnowledge) knowledge = maxKnowledge;
    }

    checkAssistant();
    updateUI();
    saveGame();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
   // === ЗАПУСК ИГРЫ ===
loadGame();

// Если прогноз не загружен — генерируем новый
if (!forecastWeather || !forecastChangeTime) {
    generateForecast();
}
    // после расчётов энергии и роботозавершения сборки, перед updateUI()
    enforceSlotLimits();
    updateUI();
    checkAssistant();

updateUI();
gameLoop();

// Функция проверки слотов и отключения лишних роботов
function enforceSlotLimits() {
    const maxSlots = chargingStations * 2;
    if (robots > maxSlots) {
        let excess = robots - maxSlots;
        // Сначала отключаем свободных роботов
        let removed = Math.min(freeRobots, excess);
        freeRobots -= removed;
        excess -= removed;
        // Затем лесорубов
        removed = Math.min(lumberjackRobots, excess);
        lumberjackRobots -= removed;
        excess -= removed;
        // Затем учёных
        removed = Math.min(scientistRobots, excess);
        scientistRobots -= removed;
        // Обновляем общее число роботов
        robots = maxSlots;
        robotProgress = 0;
        tick();
        alert('Превышено количество мест. Лишние роботы отключены.');
    }
}

// === ОБРАБОТЧИКИ КНОПОК ===
if (panelBtn) {
    panelBtn.onclick = () => {
        const cost = getNextPanelCost();
        if (energy >= cost) {
            energy -= cost;
            panels++;
            tick();
            saveGame();
            enforceSlotLimits();
            updateUI();
            checkAssistant();
        } else {
            alert('Недостаточно энергии для панели!');
        }
    };
}

if (treeBtn) {
    treeBtn.onclick = () => {
        if (energy >= 100) {
            energy -= 100;
            trees++;
            tick();
            saveGame();
            enforceSlotLimits();
            updateUI();
            checkAssistant();
        } else {
            alert('Недостаточно энергии для дерева!');
        }
    };
}

const stationBuildBtn = document.getElementById('charging-station-btn');
if (stationBuildBtn) {
    stationBuildBtn.onclick = () => {
        const cost = getNextStationCost();
        if (trees >= cost) {
            trees -= cost;
            chargingStations++;
            tick();
            saveGame();
            enforceSlotLimits();
            updateUI();
            checkAssistant();
        } else {
            alert('Недостаточно дерева для станции!');
        }
    };
}

const laboratoryBtn = document.getElementById('laboratory-btn');
if (laboratoryBtn) {
    laboratoryBtn.onclick = () => {
        const cost = getNextLaboratoryCost();
        if (trees >= cost) {
            trees -= cost;
            laboratories++;
            tick();
            saveGame();
            enforceSlotLimits();
            updateUI();
            checkAssistant();
        } else {
            alert('Недостаточно дерева для лаборатории!');
        }
    };
}


    // === НАВИГАЦИОННЫЕ КНОПКИ ===
    const mainNavBtn = document.getElementById('main-nav-btn');
    const robotsNavBtn = document.getElementById('robots-nav-btn');
    const knowledgeNavBtn = document.getElementById('knowledge-nav-btn');
    const weatherNavBtn = document.getElementById('weather-nav-btn');

    if (mainNavBtn) {
        mainNavBtn.onclick = () => showPanel('main');
    }
    if (robotsNavBtn) {
        robotsNavBtn.onclick = () => showPanel('robots');
    }
    if (knowledgeNavBtn) {
        knowledgeNavBtn.onclick = () => showPanel('knowledge');
    }
    if (weatherNavBtn) {
        weatherNavBtn.onclick = () => showPanel('weather');
    }

    if (btnExit) {
        btnExit.onclick = () => {
            saveGame();
            alert('Игра сохранена!');
        };
    }
});
