document.addEventListener('DOMContentLoaded', () => {
    // Загрузка игровых данных
    function loadGameData() {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (!savedData) return {
                freeRobots: 0,
                lumberjackRobots: 0,
                scientistRobots: 0,
                robots: 0,
                laboratories: 0
            };
            const data = JSON.parse(savedData);
            return {
                freeRobots: data.freeRobots || 0,
                lumberjackRobots: data.lumberjackRobots || 0,
                scientistRobots: data.scientistRobots || 0,
                robots: data.robots || 0,
                laboratories: data.laboratories || 0
            };
        } catch (e) {
            return {
                freeRobots: 0,
                lumberjackRobots: 0,
                scientistRobots: 0,
                robots: 0,
                laboratories: 0
            };
        }
    }

    // Сохранение изменений
    function saveChanges(freeRobots, lumberjackRobots, scientistRobots) {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (savedData) {
                const data = JSON.parse(savedData);
                data.freeRobots = freeRobots;
                data.lumberjackRobots = lumberjackRobots;
                data.scientistRobots = scientistRobots;
                localStorage.setItem('minirobots-save', JSON.stringify(data));
            }
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }

    // Обновление UI
    function updateRobotsUI() {
        const gameData = loadGameData();

        // Обновляем общий счетчик свободных роботов
        const freeRobotsElem = document.getElementById('free-robots-count');
        if (freeRobotsElem) freeRobotsElem.textContent = gameData.freeRobots;

        // Лесоруб
        const lumberjackCountElem = document.getElementById('lumberjack-count');
        const lumberjackFreeElem = document.getElementById('lumberjack-free');
        if (lumberjackCountElem) lumberjackCountElem.textContent = `Работает роботов: ${gameData.lumberjackRobots}`;
        if (lumberjackFreeElem) lumberjackFreeElem.textContent = `Свободных роботов: ${gameData.freeRobots}`;

        // Учёный
        const scientistCountElem = document.getElementById('scientist-count');
        const scientistFreeElem = document.getElementById('scientist-free');
        if (scientistCountElem) scientistCountElem.textContent = `Работает роботов: ${gameData.scientistRobots}`;
        if (scientistFreeElem) scientistFreeElem.textContent = `Свободных роботов: ${gameData.freeRobots}`;

        // Устанавливаем доступность кнопок
        updateButtonStates();
    }

    // Управление доступностью кнопок
    function updateButtonStates() {
        const gameData = loadGameData();
        const lumberjackPlusBtn = document.getElementById('lumberjack-plus');
        const lumberjackMinusBtn = document.getElementById('lumberjack-minus');
        const scientistPlusBtn = document.getElementById('scientist-plus');
        const scientistMinusBtn = document.getElementById('scientist-minus');

        if (lumberjackPlusBtn) {
            lumberjackPlusBtn.disabled = gameData.freeRobots <= 0;
            lumberjackPlusBtn.style.opacity = gameData.freeRobots <= 0 ? '0.5' : '1';
        }
        if (lumberjackMinusBtn) {
            lumberjackMinusBtn.disabled = gameData.lumberjackRobots <= 0;
            lumberjackMinusBtn.style.opacity = gameData.lumberjackRobots <= 0 ? '0.5' : '1';
        }
        if (scientistPlusBtn) {
            const canAddScientist = gameData.freeRobots > 0;
            scientistPlusBtn.disabled = !canAddScientist;
            scientistPlusBtn.style.opacity = canAddScientist ? '1' : '0.5';
        }
        if (scientistMinusBtn) {
            scientistMinusBtn.disabled = gameData.scientistRobots <= 0;
            scientistMinusBtn.style.opacity = gameData.scientistRobots <= 0 ? '0.5' : '1';
        }
    }

    // Обработчики кнопок лесоруба
    const lumberjackPlusBtn = document.getElementById('lumberjack-plus');
    const lumberjackMinusBtn = document.getElementById('lumberjack-minus');
    if (lumberjackPlusBtn) {
        lumberjackPlusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.freeRobots > 0) {
                gameData.freeRobots--;
                gameData.lumberjackRobots++;
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots, gameData.scientistRobots);
                updateRobotsUI();
            }
        };
    }
    if (lumberjackMinusBtn) {
        lumberjackMinusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.lumberjackRobots > 0) {
                gameData.lumberjackRobots--;
                gameData.freeRobots++;
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots, gameData.scientistRobots);
                updateRobotsUI();
            }
        };
    }

    // Обработчики кнопок учёного
    const scientistPlusBtn = document.getElementById('scientist-plus');
    const scientistMinusBtn = document.getElementById('scientist-minus');
    if (scientistPlusBtn) {
        scientistPlusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.freeRobots > 0) {
                gameData.freeRobots--;
                gameData.scientistRobots++;
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots, gameData.scientistRobots);
                updateRobotsUI();
            }
        };
    }
    if (scientistMinusBtn) {
        scientistMinusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.scientistRobots > 0) {
                gameData.scientistRobots--;
                gameData.freeRobots++;
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots, gameData.scientistRobots);
                updateRobotsUI();
            }
        };
    }

    // Инициализация
    updateRobotsUI();
    setInterval(updateRobotsUI, 100);
});
