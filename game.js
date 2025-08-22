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
    // Полная очистка всех данных localStorage
    localStorage.clear();
    // Немедленная перезагрузка страницы
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

    // === ИГРОВЫЕ ПЕРЕМЕННЫЕ ===
    let energy = 0;
    let panels = 1;
    let trees = 0;
    let chargingStations = 0;
    let robots = 0;
    let robotProgress = 0;
    let lastUpdate = Date.now();

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
            text: ['Вы - последний уцелевший робот после апокалипсиса. Вы должны были погибнуть в огне, но случайно нашли солнечную панель. Подключившись к ней вы смогли восстановить заряд. Сейчас нужно подождать, чтобы аккумулятор зарядился. Если построить вторую солнечную панель - зарядка пойдет быстрее.']
        },
        {
            id: 'energy-0.1',
            threshold: { energy: 0.1 },
            text: ['Вы - последний уцелевший робот после апокалипсиса. Вы должны были погибнуть в огне, но случайно нашли солнечную панель. Подключившись к ней вы смогли восстановить заряд. Сейчас нужно подождать, чтобы аккумулятор зарядился. Если построить вторую солнечную панель - зарядка пойдет быстрее.']
        },
        {
            id: 'energy-30',
            threshold: { energy: 30 },
            text: ['Что я вижу? Дым рассеялся и стало видно, что рядом есть лес. Мы можем нарубить немного дерева, однако это затратно для твоей энергии. Дождись, когда зарядка достигнет 100 и ты сможешь получать древесину.']
        },
        {
            id: 'energy-100',
            threshold: { energy: 100 },
            text: ['Вы накопили достаточно энергии, чтобы добывать древесину. Да, поначалу придется делать это руками, Соберите хотя бы 5 🌳']
        },
        {
            id: 'energy-200',
            threshold: { energy: 200 },
            text: ['Не накапливайте энерию. Покупка новых панелей позволит вам разогнать скорость зарядки, чтобы добывать больше дерева.']
        },
        {
            id: 'trees-1',
            threshold: { trees: 1 },
            text: ['Первое дерево 🌳 отправляется на склад. У вас хорошо получается!']
        },
        {
            id: 'trees-2',
            threshold: { trees: 2 },
            text: ['По достижению третьего дерева у вас появится новая технология. Вокруг валяются сломанные и поврежденные роботы - наши собратья. Их можно восстановить, но их придется заряжать на зарядных станциях. Не стройте зарядную станцию, пока зарядка не достигнет 8⚡ в секунду. Иначе вашим роботам не хватит электричества.']
        },
        {
            id: 'panels-2',
            threshold: { panels: 2 },
            text: ['Каждая солнечная панель дает ⚡ 0.63/сек. Продолжайте их строить и увидите как растет скорость зарядки.']
        },
        {
            id: 'panels-4',
            threshold: { panels: 2 },
            text: ['Солнечная энергия постоянно подпитывает зарядку. Даже если вы закрыли игру полностью и выключили свой телефон - игровой процесс не прекращается никогда.']
        },
        {
            id: 'chargingStations-1',
            threshold: { chargingStations: 1 },
            text: ['Вы построили зарядную станцию. Деревянная площадка с крышей, куда роботы могут встать, укрывшись от непогоды и подключиться к зарядке. ВНИМАНИЕ! Каждый робот потребляет 4⚡ в секунду. Если роботам не хватит энергии, они отключатся и их сознание сотрется навсегда. Не позволяйте роботам уйти в забвение, они теряют свою личность и начинают жить с нуля.']
        },
        {
            id: 'chargingStations-2',
            threshold: { chargingStations: 2 },
            text: ['Если вы построили лишнюю постройку, которая тянет из вас ресурсы - постройку можно разрушить. При этом вы не получите обратно потраченные ресурсы. Чтобы разрушить постройку нужно нажать на зеленую галочку и подтвердить снос здания кнопкой "Да".']
        },
        {
            id: 'robots-1',
            threshold: { robots: 1 },
            text: ['Одна зарядная станция позволяет разместить в ней двух роботов. Вы собрали из обломков своего первого робота. Он будет помогать вам и служить во благо новой цивилизации. не забываайте, что робот потребляет 4⚡ в сек. Если энергия кончится - роботы отключатся']
        },
        {
            id: 'robots-2',
            threshold: { robots: 2 },
            text: ['Вы построили второго робота. Если произойдет непредвиденное, и вам не будет хватить энергии, вы можете снести зарядную станцию - часть роботов "погибнет" чтобы остальные смогли заряжаться. Чтобы удалить здание - нужно нажать на зеленую галочку на кнопке здания, и подтвердить снос кнопкой "да".']
        }
    ];

    const assistantQueue = [];
    let assistantBusy = false;

    function checkAssistant() {
        const shown = JSON.parse(localStorage.getItem('shownAssistant') || '[]');
        const ctx = { panels, trees, energy, chargingStations, robots };
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

    function getMaxRobots() {
        return chargingStations * 2;
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
            lastUpdate: Date.now()
        };
        localStorage.setItem('minirobots-save', JSON.stringify(gameData));
    }

    function loadGame() {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (!savedData) {
                // Если нет сохранения, устанавливаем начальные значения
                energy = 0;
                panels = 1;
                trees = 0;
                chargingStations = 0;
                robots = 0;
                robotProgress = 0;
                lastUpdate = Date.now();
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
        } catch (e) {
            // В случае ошибки загрузки, устанавливаем начальные значения
            energy = 0;
            panels = 1;
            trees = 0;
            chargingStations = 0;
            robots = 0;
            robotProgress = 0;
            lastUpdate = Date.now();
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
            treesCountElem.textContent = trees;
        }

        // Панели
        if (panelsCountElem) {
            panelsCountElem.textContent = panels;
        }
        if (panelCostElem) {
            panelCostElem.textContent = getNextPanelCost();
        }

        // Кнопка рубки дерева - показываем ТОЛЬКО при энергии >= 30
        if (treeBtn) {
            treeBtn.style.display = energy >= 30 ? '' : 'none';
        }

        // Контейнер зарядной станции - показываем ТОЛЬКО при деревьях >= 3
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

        // Роботы - показываем только если есть роботы
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
                robotProgress = 0;
                tick();
            }
        } else {
            robotProgress = 0;
            if (robProgBar) {
                robProgBar.style.width = '0%';
            }
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

        demolishMenu.style.top = (rect.bottom + scrollTop + 4) + 'px';
        demolishMenu.style.left = (rect.left + scrollLeft) + 'px';
        demolishMenu.style.display = 'block';
        demolishMenu.setAttribute('aria-hidden', 'false');
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
                        robots = Math.max(0, robots - 2);
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
