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
        // Сброс данных исследований
        researchStatus = { meteorology: 'closed', warehouseService: 'closed' };
        researchStartTime = { meteorology: null, warehouseService: null };
        meteorologyCompleted = false;
        warehouseServiceCompleted = false;
        warehouses = 0;
        labUnlocked = false; // Сброс разблокировки лаборатории
        localStorage.removeItem('minirobots-save');
        localStorage.removeItem('shownAssistant');
        localStorage.removeItem('readAssistant'); // Добавляем сброс прочитанных сообщений
        window.location.reload();
    } catch (error) {
        console.error('Ошибка при сбросе игры:', error);
        window.location.reload();
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
const POWERMAN_PRODUCTION = 5;
const LAB_COST_BASE = 25;
const LAB_COST_RATIO = 1.15;
const LAB_KNOWLEDGE_BONUS = 0.10;
const FIRST_LAB_CAPACITY = 500;
const ADDITIONAL_LAB_CAPACITY = 250;

// === КОНСТАНТЫ СКЛАДА ===
const WAREHOUSE_BASE_COST = 50;
const WAREHOUSE_PRICE_RATIO = 1.75;
const WAREHOUSE_ENERGY_BONUS = 5000;
const WAREHOUSE_TREES_BONUS = 200;
const WAREHOUSE_MINERALS_BONUS = 250;
const WAREHOUSE_IRON_BONUS = 50;
const WAREHOUSE_COAL_BONUS = 60;
const WAREHOUSE_GOLD_BONUS = 10;
const WAREHOUSE_TITANIUM_BONUS = 2;

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
const MAX_WEATHER_DURATION = 2 * 60 * 60;

// === КОНСТАНТЫ ИССЛЕДОВАНИЙ ===
const RESEARCH_STATUS = {
    CLOSED: 'closed',
    AVAILABLE: 'available',
    INPROCESS: 'inprocess',
    COMPLETED: 'completed',
    LOCKED: 'locked'
};

const RESEARCH_REQUIREMENTS = {
    meteorology: {
        knowledgeCost: 30,
        duration: 1800 * 1000 // полчаса
    },
    warehouseService: {
        knowledgeCost: 100,
        duration: 3600 * 1000 // 1 час
    }
};

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
let powermanRobots = 0;
let warehouses = 0;

// === ПЕРЕМЕННЫЕ ИССЛЕДОВАНИЙ ===
let researchStatus = {
    meteorology: 'closed',
    warehouseService: 'closed'
};

let researchStartTime = {
    meteorology: null,
    warehouseService: null
};

let meteorologyCompleted = false;
let warehouseServiceCompleted = false;

// === ПЕРЕМЕННЫЕ ПОГОДЫ ===
let currentWeather = WEATHER_TYPES.SUNNY;
let weatherTimeRemaining = 0;
let forecastWeather = null;
let forecastChangeTime = null;

// === ПЕРЕМЕННЫЕ НАВИГАЦИИ ===
let currentPanel = 'main';

// === DOM ЭЛЕМЕНТЫ ===
let energyTextElem, panelsCountElem, panelCostElem, panelBtn, treeBtn;
let treesCountElem, robotsCountElem, maxRobotsElem, robProgCont, robProgBar;
let btnExit, knowledgeText, weatherBackBtns;

// Инициализируем DOM элементы после загрузки страницы
function initDOMElements() {
    energyTextElem = document.getElementById('energy-text');
    panelsCountElem = document.getElementById('panels-count');
    panelCostElem = document.getElementById('panel-cost');
    panelBtn = document.getElementById('panel-btn');
    treeBtn = document.getElementById('tree-btn');
    treesCountElem = document.getElementById('trees-count');
    robotsCountElem = document.getElementById('robots-count');
    maxRobotsElem = document.getElementById('max-robots');
    robProgCont = document.getElementById('robot-progress-container');
    robProgBar = document.getElementById('robot-progress-bar');
    btnExit = document.getElementById('btn-exit');
    knowledgeText = document.getElementById('knowledge-text');
    weatherBackBtns = document.querySelectorAll('#back-button');
}
// === ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ИССЛЕДОВАНИЯМИ ===
function startResearch(researchType) {
    console.log('startResearch вызвана с типом:', researchType);

    if (researchType === 'meteorology') {
        console.log('Проверяем метеорологию: знания =', knowledge, 'нужно =', RESEARCH_REQUIREMENTS.meteorology.knowledgeCost, 'статус =', researchStatus.meteorology);
        if (knowledge >= RESEARCH_REQUIREMENTS.meteorology.knowledgeCost &&
            researchStatus.meteorology === RESEARCH_STATUS.AVAILABLE) {
            knowledge -= RESEARCH_REQUIREMENTS.meteorology.knowledgeCost;
            researchStatus.meteorology = RESEARCH_STATUS.INPROCESS;
            researchStartTime.meteorology = Date.now();
            updateUI();
            saveGame();
            console.log('Исследование Метеорология начато!');
        } else {
            console.log('Метеорология не может быть начата');
        }
    } else if (researchType === 'warehouseService') {
        console.log('Проверяем склад: знания =', knowledge, 'нужно =', RESEARCH_REQUIREMENTS.warehouseService.knowledgeCost, 'статус =', researchStatus.warehouseService);
        if (knowledge >= RESEARCH_REQUIREMENTS.warehouseService.knowledgeCost &&
            researchStatus.warehouseService === RESEARCH_STATUS.AVAILABLE) {
            knowledge -= RESEARCH_REQUIREMENTS.warehouseService.knowledgeCost;
            researchStatus.warehouseService = RESEARCH_STATUS.INPROCESS;
            researchStartTime.warehouseService = Date.now();
            updateUI();
            saveGame();
            console.log('Исследование Склад и сервис начато!');
        } else {
            console.log('Склад не может быть начат: недостаточно знаний или неправильный статус');
        }
    }
}

function completeResearch(researchType) {
    if (researchType === 'meteorology') {
        researchStatus.meteorology = RESEARCH_STATUS.COMPLETED;
        meteorologyCompleted = true;
        researchStartTime.meteorology = null;
        updateUI();
        saveGame();
        console.log('Исследование Метеорология завершено!');
    } else if (researchType === 'warehouseService') {
        researchStatus.warehouseService = RESEARCH_STATUS.COMPLETED;
        warehouseServiceCompleted = true;
        researchStartTime.warehouseService = null;
        updateUI();
        saveGame();
        console.log('Исследование Склад и сервис завершено!');
    }
}

function updateResearchProgress() {
    // Проверяем исследование Метеорология
    if (researchStatus.meteorology === RESEARCH_STATUS.INPROCESS &&
        researchStartTime.meteorology !== null) {
        const elapsed = Date.now() - researchStartTime.meteorology;
        const progress = elapsed / RESEARCH_REQUIREMENTS.meteorology.duration;

        const progressBar = document.getElementById('meteorology-progress-fill');
        if (progressBar) {
            progressBar.style.width = Math.min(progress * 100, 100) + '%';
        }

        if (progress >= 1.0) {
            completeResearch('meteorology');
        }
    }

    // Проверяем исследование Склад и сервис
    if (researchStatus.warehouseService === RESEARCH_STATUS.INPROCESS &&
        researchStartTime.warehouseService !== null) {
        const elapsed = Date.now() - researchStartTime.warehouseService;
        const progress = elapsed / RESEARCH_REQUIREMENTS.warehouseService.duration;

        const progressBar = document.getElementById('warehouse-service-progress-fill');
        if (progressBar) {
            progressBar.style.width = Math.min(progress * 100, 100) + '%';
        }

        if (progress >= 1.0) {
            completeResearch('warehouseService');
        }
    }
}

function checkResearchAvailability() {
    // Проверяем исследование Метеорология
    if (researchStatus.meteorology === RESEARCH_STATUS.CLOSED && knowledge >= 30) {
        researchStatus.meteorology = RESEARCH_STATUS.AVAILABLE;
    } else if (researchStatus.meteorology === RESEARCH_STATUS.AVAILABLE && knowledge < 30) {
        researchStatus.meteorology = RESEARCH_STATUS.CLOSED;
    }

    // Проверяем исследование Склад и сервис (доступно независимо, как прогноз погоды)
    if (researchStatus.warehouseService === RESEARCH_STATUS.CLOSED && knowledge >= 100 && meteorologyCompleted) {
        researchStatus.warehouseService = RESEARCH_STATUS.AVAILABLE;
    } else if (researchStatus.warehouseService === RESEARCH_STATUS.AVAILABLE && knowledge < 100) {
        researchStatus.warehouseService = RESEARCH_STATUS.CLOSED;
    }
}

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
    if (forecastWeather) {
        currentWeather = forecastWeather;
    } else {
        const weatherOptions = Object.values(WEATHER_TYPES);
        const availableWeathers = weatherOptions.filter(w => w !== currentWeather);
        currentWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
    }
    weatherTimeRemaining = generateRandomWeatherDuration();
}

function generateForecast() {
    const options = Object.values(WEATHER_TYPES).filter(w => w !== currentWeather);
    const nextWeather = options[Math.floor(Math.random() * options.length)];
    forecastChangeTime = Date.now() + weatherTimeRemaining * 1000;
    forecastWeather = nextWeather;
    const saved = JSON.parse(localStorage.getItem('minirobots-save') || '{}');
    saved.forecastWeather = forecastWeather;
    saved.forecastChangeTime = forecastChangeTime;
    localStorage.setItem('minirobots-save', JSON.stringify(saved));
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

// === ФУНКЦИИ СКЛАДА ===
function getNextWarehouseCost() {
    return Math.floor(WAREHOUSE_BASE_COST * Math.pow(WAREHOUSE_PRICE_RATIO, warehouses));
}

function calculateMaxEnergy() {
    return MAX_ENERGY + (warehouses * WAREHOUSE_ENERGY_BONUS);
}

function calculateMaxTrees() {
    return MAX_TREES + (warehouses * WAREHOUSE_TREES_BONUS);
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
        powermanRobots: powermanRobots,
        currentWeather: currentWeather,
        weatherTimeRemaining: weatherTimeRemaining,
        forecastWeather: forecastWeather,
        forecastChangeTime: forecastChangeTime,
        researchStatus: researchStatus,
        researchStartTime: researchStartTime,
        meteorologyCompleted: meteorologyCompleted,
        warehouseServiceCompleted: warehouseServiceCompleted,
        warehouses: warehouses
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
            powermanRobots = 0;
            maxKnowledge = 0;
            researchStatus = { meteorology: 'closed', warehouseService: 'closed' };
            researchStartTime = { meteorology: null, warehouseService: null };
            meteorologyCompleted = false;
            warehouseServiceCompleted = false;
            warehouses = 0;
            labUnlocked = false;
            const weatherOptions = Object.values(WEATHER_TYPES);
            currentWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
            weatherTimeRemaining = generateRandomWeatherDuration();
            forecastWeather = null;
            forecastChangeTime = null;
            return;
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
        labUnlocked = false;
        freeRobots = data.freeRobots || 0;
        lumberjackRobots = data.lumberjackRobots || 0;
        laboratories = data.laboratories || 0;
        knowledge = data.knowledge || 0;
        scientistRobots = data.scientistRobots || 0;
        powermanRobots = data.powermanRobots || 0;
        maxKnowledge = calculateMaxKnowledge();
        currentWeather = data.currentWeather || WEATHER_TYPES.SUNNY;
        weatherTimeRemaining = data.weatherTimeRemaining || generateRandomWeatherDuration();
        forecastWeather = data.forecastWeather || null;
        forecastChangeTime = data.forecastChangeTime || null;
        researchStatus = data.researchStatus || { meteorology: 'closed', warehouseService: 'closed' };
        researchStartTime = data.researchStartTime || { meteorology: null, warehouseService: null };
        meteorologyCompleted = data.meteorologyCompleted || false;
        warehouseServiceCompleted = data.warehouseServiceCompleted || false;
        warehouses = data.warehouses || 0;

        if (data.freeRobots === undefined && data.lumberjackRobots === undefined && robots > 0) {
            freeRobots = robots;
            lumberjackRobots = 0;
            scientistRobots = 0;
            powermanRobots = 0;
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
        powermanRobots = 0;
        maxKnowledge = 0;
        researchStatus = { meteorology: 'closed', warehouseService: 'closed' };
        researchStartTime = { meteorology: null, warehouseService: null };
        meteorologyCompleted = false;
        warehouseServiceCompleted = false;
        warehouses = 0;
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
        const powermanProduction = powermanRobots * POWERMAN_PRODUCTION;
    const totalProduction = panels * getCurrentPanelProduction() + powermanProduction;
        const robotConsumption = robots * 4;
        const netProduction = totalProduction - robotConsumption;
        energyTextElem.textContent = cur + ' / ' + calculateMaxEnergy() + ' (' + netProduction.toFixed(2) + '/сек)';
    }

    if (treesCountElem) {
        const treeProduction = lumberjackRobots * LUMBERJACK_PRODUCTION;
        treesCountElem.textContent = Math.floor(trees) + ' / ' + calculateMaxTrees();
        let treeProductionElem = document.getElementById('tree-production');
        if (treeProductionElem) {
            treeProductionElem.textContent = ' (' + treeProduction.toFixed(2) + '/сек)';
        }
    }

    maxKnowledge = calculateMaxKnowledge();
    if (knowledgeText) {
        if (laboratories > 0) {
            const knowledgeProduction = scientistRobots * SCIENTIST_PRODUCTION * getKnowledgeProductionBonus();
            knowledgeText.textContent = Math.floor(knowledge) + ' / ' + maxKnowledge + ' (' + knowledgeProduction.toFixed(2) + '/сек)';
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
        weatherInfoElem.textContent = getWeatherDisplayName(currentWeather) + ' — ' + currentProduction.toFixed(2) + '/сек (' + percentage + '%)';
    }

    // Прогноз погоды
    const forecastTextElem = document.getElementById('weather-forecast-text');
    if (forecastTextElem && forecastWeather && forecastChangeTime) {
        const date = new Date(forecastChangeTime);
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const displayName = getWeatherDisplayName(forecastWeather);
        forecastTextElem.textContent = 'Будет ' + displayName.toLowerCase() + ' в ' + h + ':' + m;
    }

    // Блок лабораторий
    const laboratoryContainer = document.getElementById('laboratory-container');
    if (laboratoryContainer) {
        laboratoryContainer.style.display = 'none';
        if (trees >= 10) {
            labUnlocked = true;
        }

        if (labUnlocked) {
            laboratoryContainer.style.display = 'flex';
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
        if (researchStatus.meteorology === RESEARCH_STATUS.COMPLETED || meteorologyCompleted) {
            weatherNavBtn.style.display = 'flex';
        } else {
            weatherNavBtn.style.display = 'none';
        }
    }

    // Кнопка "Рубить дерево"
    if (treeBtn) {
        if (energy >= 30) {
            treeButtonUnlocked = true;
        }
        treeBtn.style.display = treeButtonUnlocked ? 'flex' : 'none';
    }

    // Зарядные станции
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

    // Роботы
    if (robotsCountElem) {
        robotsCountElem.textContent = Math.floor(robots);
    }

    if (maxRobotsElem) {
        maxRobotsElem.textContent = ' / ' + getMaxRobots();
    }

    // Прогресс сборки робота
    if (robProgCont) {
        if (chargingStations > 0 && robots < getMaxRobots()) {
            robProgCont.classList.remove('hidden');
        } else {
            robProgCont.classList.add('hidden');
        }
    }

    // === ЛОГИКА ИССЛЕДОВАНИЙ В updateUI ===
    checkResearchAvailability();

    // Управляем отображением исследования "Метеорология"
    const meteorologyResearch = document.getElementById('research-meteorology');
    if (meteorologyResearch) {
        if (researchStatus.meteorology !== RESEARCH_STATUS.LOCKED) {
            meteorologyResearch.style.display = 'flex';

            // Обновляем статус исследования
            const meteorologyStatus = document.getElementById('meteorology-status');
            if (meteorologyStatus) {
                if (researchStatus.meteorology === RESEARCH_STATUS.COMPLETED) {
                    meteorologyStatus.textContent = 'Исследовано';
                    meteorologyStatus.style.color = '#32d74b';
                } else {
                    meteorologyStatus.textContent = 'Изучение погодных условий';
                    meteorologyStatus.style.color = '';
                }
            }

            const startBtn = document.getElementById('meteorology-start-btn');
            const progressContainer = document.getElementById('meteorology-progress-container');

            if (researchStatus.meteorology === RESEARCH_STATUS.AVAILABLE && startBtn) {
                startBtn.style.display = 'block';
                if (progressContainer) progressContainer.style.display = 'none';
            } else if (researchStatus.meteorology === RESEARCH_STATUS.INPROCESS) {
                if (startBtn) startBtn.style.display = 'none';
                if (progressContainer) progressContainer.style.display = 'block';
            } else if (researchStatus.meteorology === RESEARCH_STATUS.COMPLETED) {
                if (startBtn) startBtn.style.display = 'none';
                if (progressContainer) progressContainer.style.display = 'none';
            } else {
                if (startBtn) startBtn.style.display = 'none';
                if (progressContainer) progressContainer.style.display = 'none';
            }
        } else {
            meteorologyResearch.style.display = 'none';
        }
    }

            // Управляем отображением исследования "Склад и сервис"
const warehouseServiceResearch = document.getElementById('research-warehouse-service');
if (warehouseServiceResearch) {
    const startBtn = document.getElementById('warehouse-service-start-btn');
    const progressContainer = document.getElementById('warehouse-service-progress-container');
    const statusElem = document.getElementById('warehouse-service-status');
    
    // всегда выводим блок исследования
    warehouseServiceResearch.style.display = 'flex';
    
    if (researchStatus.warehouseService === RESEARCH_STATUS.AVAILABLE) {
        // Показываем кнопку «Начать исследование»
        startBtn.style.display = 'block';
        progressContainer.style.display = 'none';
        statusElem.textContent = 'Система хранения ресурсов';
        statusElem.style.color = '';        
    } 
    else if (researchStatus.warehouseService === RESEARCH_STATUS.INPROCESS) {
        // Во время процесса — скрываем кнопку, показываем прогресс
        startBtn.style.display = 'none';
        progressContainer.style.display = 'block';
        statusElem.textContent = 'Исследование в процессе...';
        statusElem.style.color = '';
    } 
    else if (researchStatus.warehouseService === RESEARCH_STATUS.COMPLETED) {
        // После завершения — скрываем кнопку и прогресс, выводим зелёный статус
        startBtn.style.display = 'none';
        progressContainer.style.display = 'none';
        statusElem.textContent = 'Исследовано';
        statusElem.style.color = '#32d74b';
    }
}




    // Блок отображения складов
    const warehouseContainer = document.getElementById('warehouse-container');
    if (warehouseContainer) {
        if (warehouseServiceCompleted) {
            warehouseContainer.style.display = 'flex';

            const warehousesCountElem = document.getElementById('warehouses-count');
            const warehouseCostElem = document.getElementById('warehouse-cost');

            if (warehousesCountElem) {
                warehousesCountElem.textContent = warehouses;
            }

            if (warehouseCostElem) {
                warehouseCostElem.textContent = getNextWarehouseCost();
            }
        } else {
            warehouseContainer.style.display = 'none';
        }
    }

    updateResearchProgress();
}
// Функция проверки слотов
function enforceSlotLimits() {
    const maxSlots = chargingStations * 2;
    if (robots > maxSlots) {
        let excess = robots - maxSlots;
        let removed = Math.min(freeRobots, excess);
        freeRobots -= removed;
        excess -= removed;
        removed = Math.min(lumberjackRobots, excess);
        lumberjackRobots -= removed;
        excess -= removed;
        removed = Math.min(scientistRobots, excess);
        scientistRobots -= removed;
        excess -= removed;
        removed = Math.min(powermanRobots, excess);
        powermanRobots -= removed;
        robots = maxSlots;
        robotProgress = 0;
        tick();
        alert('Превышено количество мест. Лишние роботы отключены.');
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
        forecastWeather = null;
        forecastChangeTime = null;
        generateForecast();
    }

    const powermanProduction = powermanRobots * POWERMAN_PRODUCTION;
    const totalProduction = panels * getCurrentPanelProduction() + powermanProduction;
    const robotConsumption = robots * 4;
    const netEnergyChange = totalProduction - robotConsumption;

    if (energy < calculateMaxEnergy() && netEnergyChange > 0) {
        energy += netEnergyChange * delta;
        if (energy > calculateMaxEnergy()) energy = calculateMaxEnergy();
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
        } else if (powermanRobots > 0) {
            powermanRobots--;
        }
        robots--;
        robotProgress = 0;
        tick();
        alert('Энергия истощена! Один из роботов отключен.');
    }

    if (chargingStations > 0 && robots < getMaxRobots()) {
        robotProgress += delta / ROBOT_BUILD_TIME;
        if (robProgBar) {
            robProgBar.style.width = Math.min(robotProgress, 1) * 100 + '%';
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

    if (lumberjackRobots > 0 && trees < calculateMaxTrees()) {
        const treeGain = lumberjackRobots * LUMBERJACK_PRODUCTION * delta;
        trees += treeGain;
        if (trees > calculateMaxTrees()) trees = calculateMaxTrees();
    }

    if (scientistRobots > 0 && knowledge < maxKnowledge) {
        const knowledgeGain = scientistRobots * SCIENTIST_PRODUCTION * getKnowledgeProductionBonus() * delta;
        knowledge += knowledgeGain;
        if (knowledge > maxKnowledge) knowledge = maxKnowledge;
    }

    // Производство энергии энергетиками
    if (powermanRobots > 0 && energy < calculateMaxEnergy()) {
        const energyGain = powermanRobots * POWERMAN_PRODUCTION * delta;
        energy += energyGain;
        if (energy > calculateMaxEnergy()) energy = calculateMaxEnergy();
    }

    checkAssistant();
    updateUI();
    saveGame();
    requestAnimationFrame(gameLoop);
}

// Функция сноса зданий
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
        case 'warehouse':
            if (typeof warehouses !== 'undefined' && warehouses > 0) warehouses--;
            break;
    }

    if (typeof saveGame === 'function') saveGame();
    if (typeof updateUI === 'function') updateUI();
}

// === ПОМОЩНИК (упрощенная версия) ===
function checkAssistant() {
    // Упрощенная версия помощника
}

// === ИНИЦИАЛИЗАЦИЯ И ЗАПУСК ===
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем DOM элементы
    initDOMElements();

    // Загружаем игру
    loadGame();

    // Если прогноз не загружен — генерируем новый
    if (!forecastWeather || !forecastChangeTime) {
        generateForecast();
    }

    enforceSlotLimits();
    updateUI();
    gameLoop();

    // === ОБРАБОТЧИКИ КНОПОК ===
    if (panelBtn) {
        panelBtn.onclick = function() {
            const cost = getNextPanelCost();
            if (energy >= cost) {
                energy -= cost;
                panels++;
                tick();
                saveGame();
                enforceSlotLimits();
                updateUI();
            }
        };
    }

    if (treeBtn) {
        treeBtn.onclick = function() {
            if (energy >= 100) {
                energy -= 100;
                trees++;
                tick();
                saveGame();
                enforceSlotLimits();
                updateUI();
            }
        };
    }

    const stationBuildBtn = document.getElementById('charging-station-btn');
    if (stationBuildBtn) {
        stationBuildBtn.onclick = function() {
            const cost = getNextStationCost();
            if (trees >= cost) {
                trees -= cost;
                chargingStations++;
                tick();
                saveGame();
                enforceSlotLimits();
                updateUI();
            }
        };
    }

    const laboratoryBtn = document.getElementById('laboratory-btn');
    if (laboratoryBtn) {
        laboratoryBtn.onclick = function() {
            const cost = getNextLaboratoryCost();
            if (trees >= cost) {
                trees -= cost;
                laboratories++;
                tick();
                saveGame();
                enforceSlotLimits();
                updateUI();
            }
        };
    }

    const warehouseBtn = document.getElementById('warehouse-btn');
    if (warehouseBtn) {
        warehouseBtn.onclick = function() {
            const cost = getNextWarehouseCost();
            if (trees >= cost) {
                trees -= cost;
                warehouses++;
                tick();
                saveGame();
                enforceSlotLimits();
                updateUI();
            }
        };
    }

    // === НАВИГАЦИОННЫЕ КНОПКИ ===
    const mainNavBtn = document.getElementById('main-nav-btn');
    const robotsNavBtn = document.getElementById('robots-nav-btn');
    const knowledgeNavBtn = document.getElementById('knowledge-nav-btn');
    const weatherNavBtn = document.getElementById('weather-nav-btn');

    if (mainNavBtn) {
        mainNavBtn.onclick = function() { showPanel('main'); };
    }

    if (robotsNavBtn) {
        robotsNavBtn.onclick = function() { showPanel('robots'); };
    }

    if (knowledgeNavBtn) {
        knowledgeNavBtn.onclick = function() { showPanel('knowledge'); };
    }

    if (weatherNavBtn) {
        weatherNavBtn.onclick = function() { showPanel('weather'); };
    }

    if (btnExit) {
        btnExit.onclick = function() {
            console.log('Кнопка выхода нажата');
            saveGame();
            try {
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Ошибка перехода:', error);
                alert('Игра сохранена!');
            }
        };
    }

    // === ОБРАБОТЧИКИ ИССЛЕДОВАНИЙ ===
    const meteorologyStartBtn = document.getElementById('meteorology-start-btn');
    if (meteorologyStartBtn) {
        meteorologyStartBtn.addEventListener('click', function() {
            startResearch('meteorology');
            tick();
        });
    }

    

    // === МЕНЮ СНОСА ===
    const demolishMenu = document.getElementById('demolish-menu');
    let currentDemolishType = null;

    function showDemolishMenu(buttonElem, type) {
        currentDemolishType = type;
        demolishMenu.classList.remove('hidden');
        demolishMenu.style.visibility = 'hidden';
        demolishMenu.style.position = 'absolute';
        const rect = buttonElem.getBoundingClientRect();
        const menuWidth = demolishMenu.offsetWidth;
        const menuHeight = demolishMenu.offsetHeight;
        const padding = 8;
        let top = rect.top + window.scrollY;
        let left = rect.left + window.scrollX - menuWidth - padding;
        if (left < 0) {
            left = rect.right + window.scrollX + padding;
            if (left + menuWidth > window.innerWidth) {
                left = window.innerWidth - menuWidth - padding;
            }
        }

        if (top + menuHeight > window.innerHeight + window.scrollY) {
            top = window.innerHeight + window.scrollY - menuHeight - padding;
        }

        if (top < padding) top = padding;
        demolishMenu.style.top = top + 'px';
        demolishMenu.style.left = left + 'px';
        demolishMenu.style.visibility = 'visible';
    }

    function hideDemolishMenu() {
        demolishMenu.classList.add('hidden');
        currentDemolishType = null;
    }

    document.querySelectorAll('.demolish-btn').forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            const type = btn.getAttribute('data-type');
            showDemolishMenu(btn, type);
            event.stopPropagation();
        });

    // === ИСПРАВЛЕННЫЙ ОБРАБОТЧИК КНОПКИ СКЛАД ===
        const warehouseServiceStartBtn = document.getElementById('warehouse-service-start-btn');
        if (warehouseServiceStartBtn) {
            warehouseServiceStartBtn.addEventListener('click', function() {
                console.log('Кнопка склада нажата!');
                startResearch('warehouseService');
                tick();
            });
        } else {
            console.log('Кнопка warehouse-service-start-btn не найдена!');
        }
    });

    const demolishYesBtn = document.getElementById('demolish-yes');
    if (demolishYesBtn) {
        demolishYesBtn.addEventListener('click', function() {
            demolishBuilding(currentDemolishType);
            hideDemolishMenu();
        });
    }

    const demolishNoBtn = document.getElementById('demolish-no');
    if (demolishNoBtn) {
        demolishNoBtn.addEventListener('click', function() {
            hideDemolishMenu();
        });
    }

    document.addEventListener('click', function(event) {
        if (demolishMenu && !demolishMenu.contains(event.target) && !event.target.classList.contains('demolish-btn')) {
            hideDemolishMenu();
        }
    });

    // Кнопки "Назад"
    if (weatherBackBtns) {
        weatherBackBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                saveGame();
                window.location.reload();
            });

    // === ИСПРАВЛЕННЫЙ ОБРАБОТЧИК КНОПКИ СКЛАД ===
        const warehouseServiceStartBtn = document.getElementById('warehouse-service-start-btn');
        if (warehouseServiceStartBtn) {
            warehouseServiceStartBtn.addEventListener('click', function() {
                console.log('Кнопка склада нажата!');
                startResearch('warehouseService');
                tick();
            });
        } else {
            console.log('Кнопка warehouse-service-start-btn не найдена!');
        }
        });
    }
});