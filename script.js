let topics = [];
let totalTime = 0;
let timerInterval;
let isRunning = false;
let currentTopicIndex = -1;
let timerTitle = localStorage.getItem('timerTitle') || 'Präsentationstimer';

function addTopic() {
    const name = document.getElementById('topicName').value;
    const minutes = parseInt(document.getElementById('topicMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('topicSeconds').value) || 0;
    const totalSeconds = minutes * 60 + seconds;
    
    if (name && totalSeconds > 0) {
        topics.push({
            name: name,
            time: totalSeconds,
            remaining: totalSeconds,
            isActive: false
        });
        
        updateTopicsList();
        updateTotalTime();
        initSortable();
        
        document.getElementById('topicName').value = '';
        document.getElementById('topicMinutes').value = '';
        document.getElementById('topicSeconds').value = '';
    }
}

function initSortable() {
    const container = document.getElementById('topicsList');
    new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        touchStartThreshold: 3,
        forceFallback: true,
        fallbackClass: 'sortable-fallback',
        onEnd: function(evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            const movedItem = topics.splice(oldIndex, 1)[0];
            topics.splice(newIndex, 0, movedItem);
            updateTopicsList();
            updateTotalTime();
        }
    });
}

function updateTopicsList() {
    const container = document.getElementById('topicsList');
    container.innerHTML = '';
    
    topics.forEach((topic, index) => {
        const card = document.createElement('div');
        card.className = `col-md-4 mb-3 topic-card ${index === currentTopicIndex ? 'active-topic' : ''} ${topic.remaining === 0 ? 'expired-topic' : ''}`;
        
        const showPlayButton = !isRunning && 
            index === currentTopicIndex + 1 && 
            currentTopicIndex >= 0 && 
            topics[currentTopicIndex].remaining === 0;
        const presentationMode = document.getElementById('presentationMode').checked;
        
        card.innerHTML = `
            <div class="card">
                <div class="card-body position-relative">
                    ${!presentationMode ? `
                        <button class="btn btn-link position-absolute top-0 end-0 p-2" onclick="removeTopic(${index})">
                            <i class="bi bi-x-circle-fill remove-icon"></i>
                        </button>
                        <div class="drag-handle position-absolute bottom-0 start-0 p-2">
                            <i class="bi bi-grip-vertical"></i>
                        </div>
                    ` : ''}
                    ${showPlayButton ? `
                        <button class="btn btn-link position-absolute bottom-0 start-0 p-2 play-button" onclick="continueTimer()">
                            <i class="bi bi-play-circle-fill"></i>
                        </button>
                    ` : ''}
                    <h5 class="card-title">${topic.name}</h5>
                    <div class="text-center">
                        <h3 class="time-display" id="time-${index}">${formatTime(topic.remaining)}</h3>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateTotalTime() {
    totalTime = topics.reduce((sum, topic) => sum + topic.remaining, 0);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function toggleAutoContinue() {
    const autoContinue = document.getElementById('autoContinue').checked;
    localStorage.setItem('autoContinue', autoContinue);
}

function togglePresentationMode() {
    const presentationMode = document.getElementById('presentationMode').checked;
    localStorage.setItem('presentationMode', presentationMode);
    
    const addTopicCard = document.querySelector('.card-title').closest('.col-md-6');
    const saveButton = document.querySelector('.btn-info');
    const loadButton = document.querySelector('.btn-warning');
    
    [addTopicCard, saveButton, loadButton].forEach(element => {
        if (element) {
            element.style.display = presentationMode ? 'none' : '';
        }
    });
    
    updateTopicsList();
}

function initEditableTitle() {
    const titleElement = document.getElementById('timerTitle');
    const editIcon = document.querySelector('.edit-icon');
    
    titleElement.textContent = timerTitle;
    
    titleElement.addEventListener('click', () => {
        const newTitle = prompt('Neuer Titel:', timerTitle);
        if (newTitle && newTitle.trim() !== '') {
            timerTitle = newTitle.trim();
            titleElement.textContent = timerTitle;
            localStorage.setItem('timerTitle', timerTitle);
        }
    });
}

// Lade Einstellungen beim Start
document.addEventListener('DOMContentLoaded', function() {
    initEditableTitle();
    
    // Gesamtzeit Einstellung
    const savedShowTotalTime = localStorage.getItem('showTotalTime');
    if (savedShowTotalTime !== null) {
        document.getElementById('showTotalTime').checked = savedShowTotalTime === 'true';
        toggleTotalTime();
    }
    
    // Auto-Continue Einstellung
    const savedAutoContinue = localStorage.getItem('autoContinue');
    if (savedAutoContinue !== null) {
        document.getElementById('autoContinue').checked = savedAutoContinue === 'true';
    }
    
    // Präsentationsmodus Einstellung
    const savedPresentationMode = localStorage.getItem('presentationMode');
    if (savedPresentationMode !== null) {
        document.getElementById('presentationMode').checked = savedPresentationMode === 'true';
        togglePresentationMode();
    }
});

function startTimer() {
    if (topics.length === 0) return;
    
    isRunning = true;
    if (currentTopicIndex === -1) {
        currentTopicIndex = 0;
    }
    topics[currentTopicIndex].isActive = true;
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    
    let lastUpdate = Date.now();
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        lastUpdate = now;
        
        if (currentTopicIndex < topics.length) {
            const currentTopic = topics[currentTopicIndex];
            if (currentTopic.remaining > 0) {
                currentTopic.remaining = Math.max(0, currentTopic.remaining - delta / 1000);
                totalTime = Math.max(0, totalTime - delta / 1000);
                updateTopicsList();
                document.getElementById('totalTime').textContent = formatTime(Math.floor(totalTime));
                
                if (currentTopic.remaining === 0) {
                    const autoContinue = document.getElementById('autoContinue').checked;
                    if (autoContinue) {
                        currentTopicIndex++;
                        if (currentTopicIndex < topics.length) {
                            topics[currentTopicIndex].isActive = true;
                            updateTopicsList();
                        } else {
                            stopTimer();
                        }
                    } else {
                        isRunning = false;
                        clearInterval(timerInterval);
                        updateTopicsList();
                    }
                }
            }
        } else {
            stopTimer();
        }
    }, 10);
}

function continueTimer() {
    if (currentTopicIndex < topics.length - 1) {
        currentTopicIndex++;
        topics[currentTopicIndex].isActive = true;
        isRunning = true;
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        
        let lastUpdate = Date.now();
        
        timerInterval = setInterval(() => {
            const now = Date.now();
            const delta = now - lastUpdate;
            lastUpdate = now;
            
            if (currentTopicIndex < topics.length) {
                const currentTopic = topics[currentTopicIndex];
                if (currentTopic.remaining > 0) {
                    currentTopic.remaining = Math.max(0, currentTopic.remaining - delta / 1000);
                    totalTime = Math.max(0, totalTime - delta / 1000);
                    updateTopicsList();
                    document.getElementById('totalTime').textContent = formatTime(Math.floor(totalTime));
                    
                    if (currentTopic.remaining === 0) {
                        const autoContinue = document.getElementById('autoContinue').checked;
                        if (autoContinue) {
                            currentTopicIndex++;
                            if (currentTopicIndex < topics.length) {
                                topics[currentTopicIndex].isActive = true;
                                updateTopicsList();
                            } else {
                                stopTimer();
                            }
                        } else {
                            isRunning = false;
                            clearInterval(timerInterval);
                            updateTopicsList();
                        }
                    }
                }
            } else {
                stopTimer();
            }
        }, 10);
    }
}

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
    updateTopicsList();
}

function resetTimer() {
    stopTimer();
    currentTopicIndex = -1;
    topics.forEach(topic => {
        topic.remaining = topic.time;
        topic.isActive = false;
    });
    updateTopicsList();
    updateTotalTime();
}

function removeTopic(index) {
    topics.splice(index, 1);
    updateTopicsList();
    updateTotalTime();
}

function showSaveDialog() {
    document.getElementById('saveDialog').style.display = 'block';
    updateExistingSavesList();
}

function updateExistingSavesList() {
    const savedTimers = JSON.parse(localStorage.getItem('savedTimersList') || '{}');
    const list = document.getElementById('existingSaves');
    list.innerHTML = '';
    
    Object.keys(savedTimers).forEach(name => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => {
            if (confirm('Soll der Speicherstand "' + name + '" überschrieben werden?')) {
                saveTimersWithName(name);
            }
        };
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'Löschen';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Soll dieser Speicherstand wirklich gelöscht werden?')) {
                delete savedTimers[name];
                localStorage.setItem('savedTimersList', JSON.stringify(savedTimers));
                updateExistingSavesList();
                updateSavedTimersList();
            }
        };
        
        item.appendChild(nameSpan);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });
}

function updateSavedTimersList() {
    const savedTimers = JSON.parse(localStorage.getItem('savedTimersList') || '{}');
    const list = document.getElementById('savedTimersList');
    list.innerHTML = '';
    
    Object.keys(savedTimers).forEach(name => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => loadTimers(name);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'Löschen';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Soll dieser Speicherstand wirklich gelöscht werden?')) {
                delete savedTimers[name];
                localStorage.setItem('savedTimersList', JSON.stringify(savedTimers));
                updateSavedTimersList();
                updateExistingSavesList();
            }
        };
        
        item.appendChild(nameSpan);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });
}

function hideSaveDialog() {
    document.getElementById('saveDialog').style.display = 'none';
}

function showLoadDialog() {
    updateSavedTimersList();
    document.getElementById('loadDialog').style.display = 'block';
}

function hideLoadDialog() {
    document.getElementById('loadDialog').style.display = 'none';
}

function saveTimersWithName(saveName) {
    const timersToSave = {
        title: timerTitle,
        topics: topics.map(topic => ({
            name: topic.name,
            time: topic.time / 60
        }))
    };
    
    const savedTimers = JSON.parse(localStorage.getItem('savedTimersList') || '{}');
    savedTimers[saveName] = timersToSave;
    localStorage.setItem('savedTimersList', JSON.stringify(savedTimers));
    
    hideSaveDialog();
    document.getElementById('saveName').value = '';
    alert('Timer wurden als "' + saveName + '" gespeichert!');
}

function saveTimers() {
    const saveName = document.getElementById('saveName').value.trim();
    if (!saveName) {
        alert('Bitte einen Namen eingeben!');
        return;
    }
    
    const savedTimers = JSON.parse(localStorage.getItem('savedTimersList') || '{}');
    if (savedTimers[saveName]) {
        if (!confirm('Ein Speicherstand mit diesem Namen existiert bereits. Überschreiben?')) {
            return;
        }
    }
    
    saveTimersWithName(saveName);
}

function loadTimers(name) {
    const savedTimers = JSON.parse(localStorage.getItem('savedTimersList') || '{}');
    const timers = savedTimers[name];
    
    if (timers) {
        if (confirm('Aktuelle Timer werden überschrieben. Fortfahren?')) {
            timerTitle = timers.title || 'Präsentationstimer';
            document.getElementById('timerTitle').textContent = timerTitle;
            
            topics = timers.topics.map(timer => ({
                name: timer.name,
                time: timer.time * 60,
                remaining: timer.time * 60,
                isActive: false
            }));
            updateTopicsList();
            updateTotalTime();
            initSortable();
            hideLoadDialog();
        }
    } else {
        alert('Keine Timer mit diesem Namen gefunden!');
    }
}

function toggleTotalTime() {
    const showTotalTime = document.getElementById('showTotalTime').checked;
    localStorage.setItem('showTotalTime', showTotalTime);
    
    const totalTimeCard = document.querySelector('.col-md-6:nth-child(2)');
    if (totalTimeCard) {
        totalTimeCard.style.display = showTotalTime ? '' : 'none';
    }
}

function showSettingsDialog() {
    document.getElementById('settingsDialog').style.display = 'block';
}

function hideSettingsDialog() {
    document.getElementById('settingsDialog').style.display = 'none';
} 