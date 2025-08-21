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
const panelProduction = 0.63;
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
const energyElem = document.getElementById('energy');
const productionElem = document.getElementById('production');
const panelsCountElem = document.getElementById('panels-count');
const panelCostElem = document.getElementById('panel-cost');
const panelBtn = document.getElementById('panel-btn');
const treeBtn = document.getElementById('tree-btn');
const treesCountElem = document.getElementById('trees-count');
const treesContainer = document.getElementById('trees-container');
const stationBtn = document.getElementById('charging-station-btn');
const robotCont = document.getElementById('robots-container');
const robotsCountElem = document.getElementById('robots-count');
const maxRobotsElem = document.getElementById('max-robots');
const robProgCont = document.getElementById('robot-progress-container');
const robProgBar = document.getElementById('robot-progress-bar');
const btnExit = document.getElementById('btn-exit');
const energyTextElem = document.getElementById('energy-text');

if (btnExit) {
btnExit.onclick = () => {
saveGame(); // сохраняем текущий прогресс
window.location.href = 'index.html'; // возвращаемся в меню
};
}

// === ТЕКСТОВЫЙ ПОМОЩНИК + ОЧЕРЕДЬ ФРАЗ ===
const assistantMessages = [
{
id: 'energy-0.1',
threshold: { energy: 0.1 },
text: [
'Вы - последний уцелевший робот после апокалипсиса. Вы должны были погибнуть в огне, но случайно нашли солнечную панель',
'Подключившись к ней вы смогли восстановить заряд. Сейчас нужно подождать, чтобы аккумулятор зарядился.',
'Если построить вторую солнечную панель - зарядка пойдет быстрее.'
]
},
{
id: 'energy-200',
threshold: { energy: 200 },
text: [
'Рубите дерево. Это позволит строить зарядные станции для новых роботов. Сделаете из них дровосеков и больше не придется это делать самому. '
]
},
{
id: 'energy-30',
threshold: { energy: 30 },
text: [
'Что я вижу? Дым рассеялся и стало видно, что рядом есть лес. Мы можем нарубить немного дерева, однако это затратно для твоей энергии. Дождись, когда зарядка достигнет 100 и ты сможешь получать древесину.'
]
},
{
id: 'trees-1',
threshold: { trees: 1 },
text: [
'Первое дерево 🌳 отправляется на склад. У вас хорошо получается!'
]
},
{
id: 'trees-2',
threshold: { trees: 2 },
text: [
'По достижению третьего дерева у вас появится новая технология. Вокруг валяются сломанные и поврежденные роботы - наши собратья. Их можно восстановить, но их придется заряжать на зарядных станциях. Не стройте зарядную станцию, пока зарядка не достигнет 8⚡ в секунду. Иначе вашим роботам не хватит электричества.'
]
},
{
id: 'trees-1',
threshold: { trees: 1 },
text: [
'Первое дерево 🌳 отправляется на склад. У вас хорошо получается!'
]
},
{
id: 'chargingStations-1',
threshold: { chargingStations: 1 },
text: [
'Вы построили зарядную станцию. Деревянная площадка с крышей, куда роботы могут встать, укрывшись от непогоды и подключиться к зарядке. ВНИМАНИЕ! Каждый робот потребляет 4⚡ в секунду. Если роботам не хватит энергии, они отключатся и их сознание сотрется навсегда. Не позволяйте роботам уйти в забвение, они теряют свою личность и начинают жить с нуля'
]
},
{
id: 'robots-1',
threshold: { robots: 1 },
text: [
'Вы собрали из обломков своего первого робота. Он будет помогать вам и служить во благо новой цивилизации. Одна зарядная станция позволяет разместить только двух роботов. И, как я уже говорил, каждый будет потреблять 4⚡ в сек. Если энергия кончится - роботы отключатся и сознание их будет уничтожено.'
]
},
{
id: 'robots-2',
threshold: { robots: 2 },
text: [
'Вы построили второго робота. На данном этапе это конец игры. Продолжение еще не написано. В дальнейшем роботы, которые вы построили начнут сами добывать лес, а вы будете развивать цивилизацию, не отвлекаясь на добычу древесины. Но нужно пождать, пока разработчик внедрит новые функции',
'Спасибо за игру, и до новых встреч с мини-роботами!'
]
},
{
id: 'energy-100',
threshold: { energy: 100 },
text: [
'Вы накопили достаточно энергии, чтобы добывать древесину. Да, поначалу придется делать это руками, Соберите хотя бы 5 🌳'
]
},
{
id: 'panels-2',
threshold: { panels: 2 },
text: [
'Каждая солнечная панель дает ⚡ 0.63/сек. Продолжайте их строить и увидите как растет скорость зарядки.'
]
}
];

// Очередь фраз помощника
const assistantQueue = [];
let assistantBusy = false;

// Проверяем, нужно ли показать новое сообщение, и добавляем его в очередь
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

// Добавить строки в очередь
function enqueueAssistant(lines) {
if (!Array.isArray(lines)) return;
lines.forEach(line => assistantQueue.push(line));
if (!assistantBusy) processAssistantQueue();
}

// Обработка очереди: показываем фразы по одной
async function processAssistantQueue() {
if (assistantBusy) return;
const nextLine = assistantQueue.shift();
if (nextLine === undefined) return;
assistantBusy = true;
try {
await new Promise(resolve => {
showAssistant([nextLine]);
const textElem = document.getElementById('assistant-text');
const observer = new MutationObserver((_, obs) => {
if (!textElem.textContent.endsWith('_')) {
obs.disconnect();
resolve();
}
});
observer.observe(textElem, { childList: true, characterData: true, subtree: true });
});
} finally {
assistantBusy = false;
if (assistantQueue.length > 0) {
processAssistantQueue();
// Для паузы 20с: replace above line with:
// setTimeout(processAssistantQueue, 20000);
}
}
}

// Показываем одну строку через существующую функцию showAssistant
function showAssistant(lines) {
const panel = document.getElementById('assistant-panel');
const text = document.getElementById('assistant-text');
panel.classList.remove('hidden');
typeAssistant(lines, text, 54, () => {
// оставляем панель видимой до следующей строки
});
}

// Оригинальная функция печати по строкам (оставляем без изменений)
function typeAssistant(lines, elem, speed = 50, callback) {
let i = 0;
function nextLine() {
if (i >= lines.length) {
callback?.();
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
energy = typeof data.energy === 'number' ? data.energy : 0;
panels = typeof data.panels === 'number' ? data.panels : 1;
trees = typeof data.trees === 'number' ? data.trees : 0;
chargingStations = typeof data.chargingStations === 'number' ? data.chargingStations : 0;
robots = typeof data.robots === 'number' ? data.robots : 0;
robotProgress = typeof data.robotProgress === 'number' ? data.robotProgress : 0;
lastUpdate = data.lastUpdate || Date.now();
}

// === ОБНОВЛЕНИЕ UI ===
// === ОБНОВЛЕНИЕ UI ===
function updateUI() {
    // Энергия и производство
    if (energyTextElem) {
        const cur = Math.floor(energy);
        const totalProduction = panels * panelProduction; // Общее производство панелей
        const robotConsumption = robots * 4; // Потребление роботов (4 энергии/сек на робота)
        const netProduction = totalProduction - robotConsumption; // Чистое производство
        
        energyTextElem.innerHTML =
            `${cur}` +
            ` / ${maxEnergy} (${netProduction.toFixed(2)}/сек)`;
    } else {
        // Резерв для старой разметки, если вдруг понадобится
        energyElem.textContent = energy.toFixed(1);
        const totalProduction = panels * panelProduction;
        const robotConsumption = robots * 4;
        const netProduction = totalProduction - robotConsumption;
        productionElem.textContent = netProduction.toFixed(2);
    }
    
    treesCountElem.textContent = trees;
    // ... остальной код функции остается без изменений

// Панели
panelsCountElem.textContent = panels;
panelCostElem.textContent = getNextPanelCost();

// Кнопка рубки дерева: показываем только при энергии ≥ 30
if (treeBtn) {
treeBtn.style.display = energy >= 30 ? '' : 'none';
}

// Контейнер зарядной станции - появляется при ≥3 деревьях
const stationContainer = document.getElementById('charging-station-container');
const stationsCountSpan = document.getElementById('stations-count');
const stationCostSpan = document.getElementById('station-cost');

if (stationContainer && stationsCountSpan && stationCostSpan) {
stationContainer.style.display = trees >= 3 ? '' : 'none';
stationsCountSpan.textContent = String(chargingStations);
stationCostSpan.textContent = String(getNextStationCost());
}

// Роботы - показываем только если произведён хотя бы один робот
if (robotCont) {
robotCont.style.display = robots > 0 ? '' : 'none';
if (robotsCountElem) robotsCountElem.textContent = Math.floor(robots);
if (maxRobotsElem) maxRobotsElem.textContent = getMaxRobots();
}

// Прогресс-бар - показываем только если есть станции и идёт сборка
if (robProgCont && robProgBar) {
if (chargingStations > 0 && robots < getMaxRobots()) {
robProgCont.classList.remove('hidden');
} else {
robProgCont.classList.add('hidden');
}
}
}

// === ОСНОВНОЙ ЦИКЛ ===
// === ОСНОВНОЙ ЦИКЛ ===
function gameLoop() {
    const now = Date.now();
    const delta = (now - lastUpdate) / 1000;
    lastUpdate = now;
    
    // Производство энергии панелями
    const totalProduction = panels * panelProduction;
    const robotConsumption = robots * 4; // 4 энергии/сек на каждого робота
    const netEnergyChange = totalProduction - robotConsumption;
    
    if (energy < maxEnergy && netEnergyChange > 0) {
        energy += netEnergyChange * delta;
        if (energy > maxEnergy) energy = maxEnergy;
    } else if (netEnergyChange < 0) {
        // Если роботы потребляют больше, чем производят панели
        energy += netEnergyChange * delta;
        if (energy < 0) energy = 0;
    }

    // Сборка роботов (при наличии станций и свободного места)
    if (chargingStations > 0 && robots < getMaxRobots()) {
        robotProgress += delta / robotBuildTime;
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
        if (robProgBar) robProgBar.style.width = '0%';
    }

    // Убираем старый код потребления энергии роботами, так как он теперь учтен выше
    
    // Проверка помощника в основном цикле
    checkAssistant();
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
checkAssistant();
} else {
alert('Недостаточно энергии для панели!');
}
};

treeBtn.onclick = () => {
if (energy >= 100) {
energy -= 100; // Тратим 100 энергии
trees++; // Добавляем 1 дерево
tick(); // Звук
saveGame(); // Сохраняем
updateUI(); // Обновляем интерфейс
checkAssistant(); // Ассистент
} else {
alert('Недостаточно энергии для дерева!');
}
};

// Обработчик кнопки "Зарядная станция"
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

// === ЗАПУСК ===
loadGame();
updateUI();
gameLoop();
});
