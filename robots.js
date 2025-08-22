document.addEventListener('DOMContentLoaded', () => {
    // Загрузка игровых данных
    function loadGameData() {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (!savedData) return { freeRobots: 0, lumberjackRobots: 0, robots: 0 };
            
            const data = JSON.parse(savedData);
            return {
                freeRobots: data.freeRobots || 0,
                lumberjackRobots: data.lumberjackRobots || 0,
                robots: data.robots || 0
            };
        } catch (e) {
            return { freeRobots: 0, lumberjackRobots: 0, robots: 0 };
        }
    }

    // Сохранение изменений
    function saveChanges(freeRobots, lumberjackRobots) {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (savedData) {
                const data = JSON.parse(savedData);
                data.freeRobots = freeRobots;
                data.lumberjackRobots = lumberjackRobots;
                localStorage.setItem('minirobots-save', JSON.stringify(data));
            }
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }

    // Обновление UI
    function updateRobotsUI() {
        const gameData = loadGameData();
        
        const freeRobotsElem = document.getElementById('free-robots-count');
        const lumberjackCountElem = document.getElementById('lumberjack-count');
        
        if (freeRobotsElem) freeRobotsElem.textContent = gameData.freeRobots;
        if (lumberjackCountElem) lumberjackCountElem.textContent = gameData.lumberjackRobots;
    }

    // Обработчики кнопок
    const lumberjackPlusBtn = document.getElementById('lumberjack-plus');
    const lumberjackMinusBtn = document.getElementById('lumberjack-minus');

    if (lumberjackPlusBtn) {
        lumberjackPlusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.freeRobots > 0) {
                gameData.freeRobots--;
                gameData.lumberjackRobots++;
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots);
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
                saveChanges(gameData.freeRobots, gameData.lumberjackRobots);
                updateRobotsUI();
            }
        };
    }

    // Инициализация
    updateRobotsUI();
});
