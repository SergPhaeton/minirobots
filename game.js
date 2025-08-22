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
    localStorage.clear();
    window.location.reload(true);
}

document.addEventListener('DOMContentLoaded', () => {
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

    // === ИГРОВЫЕ ПЕРЕМЕННЫЕ ===
    let energy = 0;
    let panels = 1;
    let trees = 0;
    let chargingStations = 0;
    let robots = 0;
    let robotProgress = 0;
    let lastUpdate = Date.now();
    let treeButtonUnlocked = false;
    let freeRobots = 0;
    let lumberjackRobots = 0;
    let laboratories = 0;
    let knowledge = 0;
    let maxKnowledge = 0;
    let scientistRobots = 0;

    // === DOM ЭЛЕМЕНТЫ ===
    const energyTextElem = document.getElementById('energy-text');
    const panelsCountElem = document.getElementById('panels-count');
    const panelCostElem = document.getElementById('panel-cost');
    const panelBtn = document.getElementById('panel-btn');
    const treeBtn = document.getElementById('tree-btn');
    const treesCountElem = document.getElementById('trees-count');
    const robotCont = document.getElementById('robots-container');
    const robotsCountElem = document.getElementById('robots-count');
    const maxRobotsElem = document.getElementById('max-robots');
    const robProgCont = document.getElementById('robot-progress-container');
    const robProgBar = document.getElementById('robot-progress-bar');
    const btnExit = document.getElementById('btn-exit');
    const knowledgeDisplay = document.getElementById('knowledge-display');
    const knowledgeText = document.getElementById('knowledge-text');

    // === ОБРАБОТЧИКИ КНОПОК СБРОСА ===
    const resetYesBtn = document.getElementById('reset-yes');
    if (resetYesBtn) {
        resetYesBtn.onclick = () => {
            resetGame();
        };
    }

    const resetNoBtn = document.getElementById('reset-no');
    if (resetNoBtn) {
        resetNoBtn.onclick = () => {
            // Логика отмены сброса
        };
    }

    if (btnExit) {
        btnExit.onclick = () => {
            saveGame();
            window.location.href = 'index.html';
        };
    }

    // === ТЕКСТОВЫЙ ПОМОЩНИК ===
    const assistantMessages = [
        {
            id: 'energy-0.1',
            threshold: { energy: 0.1 },
            text: ['Вы - последний уцелевший робот после апокалипсиса. Вы должны были погибнуть в огне, но случайно нашли солнечную панель. Подключившись к ней вы смогли восстановить заряд. Сейчас нужно подождать, чтобы аккумулятор зарядился. Нажмите на ☀️ солнце, чтобы построить вторую солнечную панель - зарядка пойдет быстрее.']
        },
        {
            id: 'energy-20',
            threshold: { energy: 20 },
            text: ['Что я вижу? Дым рассеялся и стало видно, что рядом есть лес. Мы можем нарубить немного дерева, однако это затратно для твоей энергии. Дождись, когда зарядка достигнет 100 и ты сможешь получать древесину.']
        },
        {
            id: 'energy-100',
            threshold: { energy: 100 },
            text: ['Вы накопили достаточно энергии, чтобы добывать древесину. Да, поначалу придется делать это руками, Соберите хотя бы 5 🌳']
        },
        {
            id: 'trees-10',
            threshold: { trees: 10 },
            text: ['Отлично! Вы собрали достаточно дерева. Теперь доступна постройка лаборатории. Лаборатории позволят вам накапливать знания и развивать новые технологии. Постройте первую лабораторию для исследований!']
        },
        {
            id: 'laboratories-1',
            threshold: { laboratories: 1 },
            text: ['Вы построили первую лабораторию! Теперь можете назначать роботов учёными для производства знаний. Перейдите в раздел "Знания" чтобы управлять исследованиями. Каждая лаборатория увеличивает эффективность производства знаний на 10%.']
        },
        {
            id: 'knowledge-50',
            threshold: { knowledge: 50 },
            text: ['Ваши учёные накапливают знания! Знания - это основа для будущих технологических прорывов. Продолжайте строить лаборатории и назначать учёных для ускорения исследований.']
        }
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
            // ИЗМЕНЕНИЕ ПОЗИЦИИ ПОМОЩНИКА НА ВЕРХ
            panel.style.position = 'fixed';
            panel.style.top = '20px';
            panel.style.bottom = 'auto';
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
            scientistRobots: scientistRobots
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
                freeRobots = 0;
                lumberjackRobots = 0;
                laboratories = 0;
                knowledge = 0;
                scientistRobots = 0;
                maxKnowledge = 0;
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
            freeRobots = data.freeRobots || 0;
            lumberjackRobots = data.lumberjackRobots || 0;
            laboratories = data.laboratories || 0;
            knowledge = data.knowledge || 0;
            scientistRobots = data.scientistRobots || 0;
            maxKnowledge = calculateMaxKnowledge();

            // Миграция старых сохранений
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
        }
    }

    // === ОБНОВЛЕНИЕ UI ===
    function updateUI() {
        // Энергия и производство
        if (energyTextElem) {
            const cur = Math.floor(energy);
            const totalProduction = panels * PANEL_PRODUCTION;
            const robotConsumption = robots * 4;
            const netProduction = totalProduction - robotConsumption;
            energyTextElem.innerHTML = `${cur} / ${MAX_ENERGY} (${netProduction.toFixed(2)}/сек)`;
        }

        // Деревья
        if (treesCountElem) {
            const treeProduction = lumberjackRobots * LUMBERJACK_PRODUCTION;
            treesCountElem.textContent = `${Math.floor(trees)} / ${MAX_TREES}`;
            let treeProductionElem = document.getElementById('tree-production');
            if (!treeProductionElem) {
                treeProductionElem = document.createElement('span');
                treeProductionElem.id = 'tree-production';
                treesCountElem.parentElement.appendChild(treeProductionElem);
            }
            treeProductionElem.textContent = ` (${treeProduction.toFixed(2)}/сек)`;
        }

        // Знания
        maxKnowledge = calculateMaxKnowledge();
        if (knowledgeDisplay && laboratories > 0) {
            knowledgeDisplay.style.display = '';
            const knowledgeProduction = scientistRobots * SCIENTIST_PRODUCTION * getKnowledgeProductionBonus();
            knowledgeText.innerHTML = `${Math.floor(knowledge)} / ${maxKnowledge} (${knowledgeProduction.toFixed(2)}/сек)`;
        } else if (knowledgeDisplay) {
            knowledgeDisplay.style.display = 'none';
        }

        // Панели
        if (panelsCountElem) {
            panelsCountElem.textContent = panels;
        }

        if (panelCostElem) {
            panelCostElem.textContent = getNextPanelCost();
        }

        // Лаборатории
        const laboratoryContainer = document.getElementById('laboratory-container');
        if (laboratoryContainer) {
            laboratoryContainer.style.display = trees >= 10 ? '' : 'none';
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
            labKnowledgeBonusElem.textContent = laboratories === 0 ? '500' : '250';
        }

        // Кнопка навигации к знаниям
        const knowledgeNavContainer = document.getElementById('knowledge-nav-container');
        if (knowledgeNavContainer) {
            knowledgeNavContainer.style.display = laboratories > 0 ? '' : 'none';
        }

        // Кнопка навигации к роботам
        const robotsNavContainer = document.getElementById('robots-nav-container');
        if (robotsNavContainer) {
            robotsNavContainer.style.display = robots > 0 ? '' : 'none';
        }

        // Кнопка рубки дерева
        if (treeBtn) {
            if (energy >= 30) {
                treeButtonUnlocked = true;
            }
            treeBtn.style.display = treeButtonUnlocked ? '' : 'none';
        }

        // Контейнер зарядной станции
        const stationContainer = document.getElementById('charging-station-container');
        if (stationContainer) {
            stationContainer.style.display = trees >= 3 ? '' : 'none';
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
        if (robotCont) {
            robotCont.style.display = robots > 0 ? '' : 'none';
        }

        if (robotsCountElem) {
            robotsCountElem.textContent = Math.floor(robots);
        }

        if (maxRobotsElem) {
            maxRobotsElem.textContent = getMaxRobots();
        }

        // Прогресс-бар роботов
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

        // Производство и потребление энергии
        const totalProduction = panels * PANEL_PRODUCTION;
        const robotConsumption = robots * 4;
        const netEnergyChange = totalProduction - robotConsumption;

        if (energy < MAX_ENERGY && netEnergyChange > 0) {
            energy += netEnergyChange * delta;
            if (energy > MAX_ENERGY) energy = MAX_ENERGY;
        } else if (netEnergyChange < 0) {
            energy += netEnergyChange * delta;
            if (energy < 0) energy = 0;
        }

        // Проверка отключения роботов при нехватке энергии
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

        // Сборка роботов
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

        // Производство дерева лесорубами
        if (lumberjackRobots > 0 && trees < MAX_TREES) {
            const treeGain = lumberjackRobots * LUMBERJACK_PRODUCTION * delta;
            trees += treeGain;
            if (trees > MAX_TREES) trees = MAX_TREES;
        }

        // Производство знаний учёными
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

    // === ОБРАБОТЧИКИ КНОПОК ===
    if (panelBtn) {
        panelBtn.onclick = () => {
            const cost = getNextPanelCost();
            if (energy >= cost) {
                energy -= cost;
                panels++;
                tick();
                saveGame();
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
                updateUI();
                checkAssistant();
            } else {
                alert('Недостаточно дерева для лаборатории!');
            }
        };
    }

    // Обработчик кнопки "Роботы"
    const robotsNavBtn = document.getElementById('robots-nav-btn');
    if (robotsNavBtn) {
        robotsNavBtn.onclick = () => {
            saveGame();
            window.location.href = 'robots.html';
        };
    }

    // Обработчик кнопки "Знания"
    const knowledgeNavBtn = document.getElementById('knowledge-nav-btn');
    if (knowledgeNavBtn) {
        knowledgeNavBtn.onclick = () => {
            saveGame();
            window.location.href = 'laboratory.html';
        };
    }

    // === ЛОГИКА СНОСА ЗДАНИЙ ===
    const demolishMenu = document.getElementById('demolish-menu');
    const demolishYesBtn = document.getElementById('demolish-yes');
    const demolishNoBtn = document.getElementById('demolish-no');
    let currentDemolishBtn = null;

    function showDemolishMenu(triggerElem, buildingBtn) {
        if (!demolishMenu) return;
        const rect = triggerElem.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        demolishMenu.style.display = 'block';
        demolishMenu.setAttribute('aria-hidden', 'false');
        demolishMenu.style.left = (rect.left + scrollLeft - demolishMenu.offsetWidth) + 'px';
        demolishMenu.style.top = (rect.bottom + scrollTop + 4) + 'px';
        currentDemolishBtn = buildingBtn;
    }

    function hideDemolishMenu() {
        if (!demolishMenu) return;
        demolishMenu.style.display = 'none';
        demolishMenu.setAttribute('aria-hidden', 'true');
        currentDemolishBtn = null;
    }

    document.querySelectorAll('.demolish-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentDemolishBtn === trigger.parentElement) {
                hideDemolishMenu();
                return;
            }
            showDemolishMenu(trigger, trigger.parentElement);
        });
    });

    document.addEventListener('click', () => {
        hideDemolishMenu();
    });

    if (demolishNoBtn) {
        demolishNoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideDemolishMenu();
        });
    }

    if (demolishYesBtn) {
        demolishYesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentDemolishBtn) return;

            switch (currentDemolishBtn.id) {
                case 'panel-btn':
                    if (panels > 0) {
                        panels--;
                        updateUI();
                    }
                    break;
                case 'charging-station-btn':
                    if (chargingStations > 0) {
                        chargingStations--;
                        const removedRobots = Math.min(2, robots);
                        const removedFree = Math.min(removedRobots, freeRobots);
                        const remainingToRemove = removedRobots - removedFree;
                        
                        freeRobots -= removedFree;
                        
                        let removedLumberjacks = Math.min(remainingToRemove, lumberjackRobots);
                        lumberjackRobots -= removedLumberjacks;
                        
                        let removedScientists = remainingToRemove - removedLumberjacks;
                        scientistRobots -= Math.min(removedScientists, scientistRobots);
                        
                        robots = Math.max(0, robots - removedRobots);
                        updateUI();
                    }
                    break;
                case 'laboratory-btn':
                    if (laboratories > 0) {
                        laboratories--;
                        
                        // УБРАНО ОГРАНИЧЕНИЕ НА УЧЁНЫХ ПРИ СНОСЕ ЛАБОРАТОРИИ
                        // Теперь учёные могут работать без привязки к количеству лабораторий
                        
                        // Пересчитываем максимум знаний
                        maxKnowledge = calculateMaxKnowledge();
                        if (knowledge > maxKnowledge) {
                            knowledge = maxKnowledge;
                        }
                        
                        updateUI();
                    }
                    break;
            }

            hideDemolishMenu();
            saveGame();
        });
    }

    // === ЗАПУСК ИГРЫ ===
    loadGame();
    updateUI();
    gameLoop();
});
