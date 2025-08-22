document.addEventListener('DOMContentLoaded', () => {
    // Загрузка игровых данных
    function loadGameData() {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (!savedData) return { 
                freeRobots: 0,
                scientistRobots: 0,
                laboratories: 0,
                knowledge: 0,
                maxKnowledge: 0
            };
            
            const data = JSON.parse(savedData);
            const maxKnowledge = calculateMaxKnowledge(data.laboratories || 0);
            
            return {
                freeRobots: data.freeRobots || 0,
                scientistRobots: data.scientistRobots || 0,
                laboratories: data.laboratories || 0,
                knowledge: data.knowledge || 0,
                maxKnowledge: maxKnowledge
            };
        } catch (e) {
            return { 
                freeRobots: 0,
                scientistRobots: 0,
                laboratories: 0,
                knowledge: 0,
                maxKnowledge: 0
            };
        }
    }
    
    // Расчёт максимума знаний
    function calculateMaxKnowledge(laboratories) {
        if (laboratories === 0) return 0;
        return 500 + (laboratories - 1) * 250;
    }
    
    // Расчёт бонуса производства
    function getKnowledgeProductionBonus(laboratories) {
        return 1 + (laboratories * 0.10);
    }
    
    // Сохранение изменений
    function saveChanges(freeRobots, scientistRobots) {
        try {
            const savedData = localStorage.getItem('minirobots-save');
            if (savedData) {
                const data = JSON.parse(savedData);
                data.freeRobots = freeRobots;
                data.scientistRobots = scientistRobots;
                localStorage.setItem('minirobots-save', JSON.stringify(data));
            }
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }
    
    // Обновление UI
    function updateLaboratoryUI() {
        const gameData = loadGameData();
        
        // Информация о знаниях
        const currentKnowledgeElem = document.getElementById('current-knowledge');
        const maxKnowledgeElem = document.getElementById('max-knowledge');
        const knowledgeProductionElem = document.getElementById('knowledge-production');
        const knowledgeFillElem = document.getElementById('knowledge-fill');
        
        if (currentKnowledgeElem) currentKnowledgeElem.textContent = Math.floor(gameData.knowledge);
        if (maxKnowledgeElem) maxKnowledgeElem.textContent = gameData.maxKnowledge;
        
        // Производство знаний
        const production = gameData.scientistRobots * 0.175 * getKnowledgeProductionBonus(gameData.laboratories);
        if (knowledgeProductionElem) knowledgeProductionElem.textContent = `+${production.toFixed(2)}/сек`;
        
        // Прогресс-бар знаний
        if (knowledgeFillElem && gameData.maxKnowledge > 0) {
            const percentage = Math.min(100, (gameData.knowledge / gameData.maxKnowledge) * 100);
            knowledgeFillElem.style.width = `${percentage}%`;
        }
        
        // Информация о роботах
        const freeRobotsElem = document.getElementById('free-robots-count');
        const scientistCountElem = document.getElementById('scientist-count');
        const scientistSlotsElem = document.getElementById('scientist-slots');
        
        if (freeRobotsElem) freeRobotsElem.textContent = gameData.freeRobots;
        if (scientistCountElem) scientistCountElem.textContent = gameData.scientistRobots;
        if (scientistSlotsElem) scientistSlotsElem.textContent = gameData.laboratories;
        
        // Управление доступностью кнопок
        updateButtonStates();
    }
    
    // Обновление состояния кнопок
    function updateButtonStates() {
        const gameData = loadGameData();
        
        const scientistPlusBtn = document.getElementById('scientist-plus');
        const scientistMinusBtn = document.getElementById('scientist-minus');
        
        if (scientistPlusBtn) {
            const canAddScientist = gameData.freeRobots > 0 && gameData.scientistRobots < gameData.laboratories;
            scientistPlusBtn.disabled = !canAddScientist;
            scientistPlusBtn.style.opacity = canAddScientist ? '1' : '0.5';
        }
        
        if (scientistMinusBtn) {
            scientistMinusBtn.disabled = gameData.scientistRobots <= 0;
            scientistMinusBtn.style.opacity = gameData.scientistRobots <= 0 ? '0.5' : '1';
        }
    }
    
    // Обработчики кнопок
    const scientistPlusBtn = document.getElementById('scientist-plus');
    const scientistMinusBtn = document.getElementById('scientist-minus');
    
    if (scientistPlusBtn) {
        scientistPlusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.freeRobots > 0 && gameData.scientistRobots < gameData.laboratories) {
                gameData.freeRobots--;
                gameData.scientistRobots++;
                saveChanges(gameData.freeRobots, gameData.scientistRobots);
                updateLaboratoryUI();
            }
        };
    }
    
    if (scientistMinusBtn) {
        scientistMinusBtn.onclick = () => {
            const gameData = loadGameData();
            if (gameData.scientistRobots > 0) {
                gameData.scientistRobots--;
                gameData.freeRobots++;
                saveChanges(gameData.freeRobots, gameData.scientistRobots);
                updateLaboratoryUI();
            }
        };
    }
    
    // Инициализация
    updateLaboratoryUI();
    
    // Обновляем UI каждые 100мс для синхронизации с основной игрой
    setInterval(updateLaboratoryUI, 100);
});
