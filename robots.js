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

  // Управление доступностью кнопок
  function updateButtonStates() {
    const gameData = loadGameData();
    const lbPlus = document.getElementById('lumberjack-plus');
    const lbMinus = document.getElementById('lumberjack-minus');
    const scPlus = document.getElementById('scientist-plus');
    const scMinus = document.getElementById('scientist-minus');

    if (lbPlus) {
      lbPlus.disabled = gameData.freeRobots <= 0;
      lbPlus.style.opacity = gameData.freeRobots <= 0 ? '0.5' : '1';
    }
    if (lbMinus) {
      lbMinus.disabled = gameData.lumberjackRobots <= 0;
      lbMinus.style.opacity = gameData.lumberjackRobots <= 0 ? '0.5' : '1';
    }

    const scContainer = document.getElementById('scientist-container');
    if (scContainer) {
      if (gameData.laboratories > 0) {
        scContainer.style.display = 'flex';
        if (scPlus) {
          scPlus.disabled = gameData.freeRobots <= 0;
          scPlus.style.opacity = gameData.freeRobots <= 0 ? '0.5' : '1';
        }
        if (scMinus) {
          scMinus.disabled = gameData.scientistRobots <= 0;
          scMinus.style.opacity = gameData.scientistRobots <= 0 ? '0.5' : '1';
        }
      } else {
        scContainer.style.display = 'none';
      }
    }
  }

  // Обновление UI
  function updateRobotsUI() {
    const gameData = loadGameData();

    document.getElementById('free-robots-count').textContent = gameData.freeRobots;
    document.getElementById('lumberjack-count').textContent = `Работает роботов: ${gameData.lumberjackRobots}`;
    document.getElementById('lumberjack-free').textContent = `Свободных роботов: ${gameData.freeRobots}`;
    document.getElementById('scientist-count').textContent = `Работает роботов: ${gameData.scientistRobots}`;
    document.getElementById('scientist-free').textContent = `Свободных роботов: ${gameData.freeRobots}`;

    updateButtonStates();
  }

  // Обработчики кнопок
  document.getElementById('lumberjack-plus').onclick = () => {
    const data = loadGameData();
    if (data.freeRobots > 0) {
      data.freeRobots--; data.lumberjackRobots++;
      saveChanges(data.freeRobots, data.lumberjackRobots, data.scientistRobots);
      updateRobotsUI();
    }
  };
  document.getElementById('lumberjack-minus').onclick = () => {
    const data = loadGameData();
    if (data.lumberjackRobots > 0) {
      data.lumberjackRobots--; data.freeRobots++;
      saveChanges(data.freeRobots, data.lumberjackRobots, data.scientistRobots);
      updateRobotsUI();
    }
  };
  document.getElementById('scientist-plus').onclick = () => {
    const data = loadGameData();
    if (data.freeRobots > 0) {
      data.freeRobots--; data.scientistRobots++;
      saveChanges(data.freeRobots, data.lumberjackRobots, data.scientistRobots);
      updateRobotsUI();
    }
  };
  document.getElementById('scientist-minus').onclick = () => {
    const data = loadGameData();
    if (data.scientistRobots > 0) {
      data.scientistRobots--; data.freeRobots++;
      saveChanges(data.freeRobots, data.lumberjackRobots, data.scientistRobots);
      updateRobotsUI();
    }
  };

  // Старт
  updateRobotsUI();
  setInterval(updateRobotsUI, 100);
});
