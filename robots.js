// === ЗАГРУЗКА ДАННЫХ ИЗ ГЛАВНОЙ ИГРЫ ===

// Функция загрузки игровых данных
function loadGameData() {
    try {
        const savedData = localStorage.getItem('minirobots-save');
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
    }
    return null;
}

// Функция сохранения данных
function saveGameData(data) {
    try {
        localStorage.setItem('minirobots-save', JSON.stringify(data));
    } catch (e) {
        console.error('Ошибка сохранения данных:', e);
    }
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===

function updateRobotsUI() {
    const gameData = loadGameData();
    if (!gameData) return;

    const freeRobots = gameData.freeRobots || 0;
    const lumberjackRobots = gameData.lumberjackRobots || 0;
    const scientistRobots = gameData.scientistRobots || 0;
    const powermanRobots = gameData.powermanRobots || 0;
    const warehouseServiceCompleted = gameData.warehouseServiceCompleted || false;

    // Обновляем счетчик свободных роботов
    const freeRobotsElem = document.getElementById('free-robots-count');
    if (freeRobotsElem) {
        freeRobotsElem.textContent = freeRobots;
    }

    // Лесоруб
    const lumberjackCountElem = document.getElementById('lumberjack-count');
    const lumberjackFreeElem = document.getElementById('lumberjack-free');
    if (lumberjackCountElem) lumberjackCountElem.textContent = `Работает роботов: ${lumberjackRobots}`;
    if (lumberjackFreeElem) lumberjackFreeElem.textContent = `Свободных роботов: ${freeRobots}`;

    // Учёный
    const scientistCountElem = document.getElementById('scientist-count');
    const scientistFreeElem = document.getElementById('scientist-free');
    const laboratories = gameData.laboratories || 0;
    if (scientistCountElem) scientistCountElem.textContent = `Работает роботов: ${scientistRobots}`;
    if (scientistFreeElem) scientistFreeElem.textContent = `Свободных роботов: ${freeRobots}`;

    // Показываем/скрываем контейнер учёного
    const scientistContainer = document.getElementById('scientist-container');
    if (scientistContainer) {
        scientistContainer.style.display = laboratories > 0 ? 'flex' : 'none';
    }

    // Энергетик
    const powermanCountElem = document.getElementById('powerman-count');
    const powermanFreeElem = document.getElementById('powerman-free');
    if (powermanCountElem) powermanCountElem.textContent = `Работает роботов: ${powermanRobots}`;
    if (powermanFreeElem) powermanFreeElem.textContent = `Свободных роботов: ${freeRobots}`;

    // Показываем/скрываем контейнер энергетика только если исследование завершено
    const powermanContainer = document.getElementById('powerman-container');
    if (powermanContainer) {
        powermanContainer.style.display = warehouseServiceCompleted ? 'flex' : 'none';
    }
}

// === УПРАВЛЕНИЕ РОБОТАМИ ===

function assignRobot(type) {
    const gameData = loadGameData();
    if (!gameData) return;

    if (gameData.freeRobots > 0) {
        gameData.freeRobots--;

        switch(type) {
            case 'lumberjack':
                gameData.lumberjackRobots = (gameData.lumberjackRobots || 0) + 1;
                break;
            case 'scientist':
                gameData.scientistRobots = (gameData.scientistRobots || 0) + 1;
                break;
            case 'powerman':
                gameData.powermanRobots = (gameData.powermanRobots || 0) + 1;
                break;
        }

        saveGameData(gameData);
        updateRobotsUI();
    }
}

function unassignRobot(type) {
    const gameData = loadGameData();
    if (!gameData) return;

    let canUnassign = false;

    switch(type) {
        case 'lumberjack':
            if (gameData.lumberjackRobots > 0) {
                gameData.lumberjackRobots--;
                canUnassign = true;
            }
            break;
        case 'scientist':
            if (gameData.scientistRobots > 0) {
                gameData.scientistRobots--;
                canUnassign = true;
            }
            break;
        case 'powerman':
            if (gameData.powermanRobots > 0) {
                gameData.powermanRobots--;
                canUnassign = true;
            }
            break;
    }

    if (canUnassign) {
        gameData.freeRobots = (gameData.freeRobots || 0) + 1;
        saveGameData(gameData);
        updateRobotsUI();
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener('DOMContentLoaded', function() {
    // Обновляем интерфейс
    updateRobotsUI();

    // Устанавливаем обработчики событий

    // Лесоруб
    const lumberjackPlus = document.getElementById('lumberjack-plus');
    const lumberjackMinus = document.getElementById('lumberjack-minus');
    if (lumberjackPlus) lumberjackPlus.onclick = () => assignRobot('lumberjack');
    if (lumberjackMinus) lumberjackMinus.onclick = () => unassignRobot('lumberjack');

    // Учёный
    const scientistPlus = document.getElementById('scientist-plus');
    const scientistMinus = document.getElementById('scientist-minus');
    if (scientistPlus) scientistPlus.onclick = () => assignRobot('scientist');
    if (scientistMinus) scientistMinus.onclick = () => unassignRobot('scientist');

    // Энергетик
    const powermanPlus = document.getElementById('powerman-plus');
    const powermanMinus = document.getElementById('powerman-minus');
    if (powermanPlus) powermanPlus.onclick = () => assignRobot('powerman');
    if (powermanMinus) powermanMinus.onclick = () => unassignRobot('powerman');

    // Обновляем интерфейс каждые 100мс
    setInterval(updateRobotsUI, 100);
});
