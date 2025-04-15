let speakers = [];
let totalTime = 0;
let timerInterval;
let isRunning = false;
let currentSpeakerIndex = -1;

function addSpeaker() {
    const name = document.getElementById('speakerName').value;
    const minutes = parseInt(document.getElementById('speakerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('speakerSeconds').value) || 0;
    const totalSeconds = minutes * 60 + seconds;
    
    if (name && totalSeconds > 0) {
        speakers.push({
            name: name,
            time: totalSeconds,
            remaining: totalSeconds,
            isActive: false
        });
        
        updateSpeakersList();
        updateTotalTime();
        initSortable();
        
        document.getElementById('speakerName').value = '';
        document.getElementById('speakerMinutes').value = '';
        document.getElementById('speakerSeconds').value = '';
    }
}

function initSortable() {
    const container = document.getElementById('speakersList');
    new Sortable(container, {
        animation: 150,
        onEnd: function(evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            const movedItem = speakers.splice(oldIndex, 1)[0];
            speakers.splice(newIndex, 0, movedItem);
            updateSpeakersList();
            updateTotalTime();
        }
    });
}

function updateSpeakersList() {
    const container = document.getElementById('speakersList');
    container.innerHTML = '';
    
    speakers.forEach((speaker, index) => {
        const card = document.createElement('div');
        card.className = `col-md-4 mb-3 speaker-card ${index === currentSpeakerIndex ? 'active-speaker' : ''} ${speaker.remaining === 0 ? 'expired-topic' : ''}`;
        
        const showPlayButton = !isRunning && 
            index === currentSpeakerIndex + 1 && 
            currentSpeakerIndex >= 0 && 
            speakers[currentSpeakerIndex].remaining === 0;
        
        card.innerHTML = `
            <div class="card">
                <div class="card-body position-relative">
                    <button class="btn btn-link position-absolute top-0 end-0 p-2" onclick="removeSpeaker(${index})">
                        <i class="bi bi-x-circle-fill remove-icon"></i>
                    </button>
                    ${showPlayButton ? `
                        <button class="btn btn-link position-absolute bottom-0 start-0 p-2 play-button" onclick="continueTimer()">
                            <i class="bi bi-play-circle-fill"></i>
                        </button>
                    ` : ''}
                    <h5 class="card-title">${speaker.name}</h5>
                    <div class="text-center">
                        <h3 class="time-display" id="time-${index}">${formatTime(speaker.remaining)}</h3>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateTotalTime() {
    totalTime = speakers.reduce((sum, speaker) => sum + speaker.remaining, 0);
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
    const totalTimeCard = document.querySelector('.col-md-6:nth-child(2)');
    const saveButton = document.querySelector('.btn-info');
    const loadButton = document.querySelector('.btn-warning');
    
    [addTopicCard, totalTimeCard, saveButton, loadButton].forEach(element => {
        if (element) {
            element.style.display = presentationMode ? 'none' : '';
        }
    });
}

// Lade Einstellungen beim Start
document.addEventListener('DOMContentLoaded', function() {
    const savedShowTotalTime = localStorage.getItem('showTotalTime');
    if (savedShowTotalTime !== null) {
        document.getElementById('showTotalTime').checked = savedShowTotalTime === 'true';
        toggleTotalTime();
    }
    
    const savedAutoContinue = localStorage.getItem('autoContinue');
    if (savedAutoContinue !== null) {
        document.getElementById('autoContinue').checked = savedAutoContinue === 'true';
    }
    
    const savedPresentationMode = localStorage.getItem('presentationMode');
    if (savedPresentationMode !== null) {
        document.getElementById('presentationMode').checked = savedPresentationMode === 'true';
        togglePresentationMode();
    }
});

function startTimer() {
    if (speakers.length === 0) return;
    
    isRunning = true;
    if (currentSpeakerIndex === -1) {
        currentSpeakerIndex = 0;
    }
    speakers[currentSpeakerIndex].isActive = true;
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    
    let lastUpdate = Date.now();
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        lastUpdate = now;
        
        if (currentSpeakerIndex < speakers.length) {
            const currentSpeaker = speakers[currentSpeakerIndex];
            if (currentSpeaker.remaining > 0) {
                currentSpeaker.remaining = Math.max(0, currentSpeaker.remaining - delta / 1000);
                totalTime = Math.max(0, totalTime - delta / 1000);
                updateSpeakersList();
                document.getElementById('totalTime').textContent = formatTime(Math.floor(totalTime));
                
                if (currentSpeaker.remaining === 0) {
                    const autoContinue = document.getElementById('autoContinue').checked;
                    if (autoContinue) {
                        currentSpeakerIndex++;
                        if (currentSpeakerIndex < speakers.length) {
                            speakers[currentSpeakerIndex].isActive = true;
                            updateSpeakersList();
                        } else {
                            stopTimer();
                        }
                    } else {
                        isRunning = false;
                        clearInterval(timerInterval);
                        updateSpeakersList();
                    }
                }
            }
        } else {
            stopTimer();
        }
    }, 10);
}

function continueTimer() {
    if (currentSpeakerIndex < speakers.length - 1) {
        currentSpeakerIndex++;
        speakers[currentSpeakerIndex].isActive = true;
        isRunning = true;
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        
        let lastUpdate = Date.now();
        
        timerInterval = setInterval(() => {
            const now = Date.now();
            const delta = now - lastUpdate;
            lastUpdate = now;
            
            if (currentSpeakerIndex < speakers.length) {
                const currentSpeaker = speakers[currentSpeakerIndex];
                if (currentSpeaker.remaining > 0) {
                    currentSpeaker.remaining = Math.max(0, currentSpeaker.remaining - delta / 1000);
                    totalTime = Math.max(0, totalTime - delta / 1000);
                    updateSpeakersList();
                    document.getElementById('totalTime').textContent = formatTime(Math.floor(totalTime));
                    
                    if (currentSpeaker.remaining === 0) {
                        const autoContinue = document.getElementById('autoContinue').checked;
                        if (autoContinue) {
                            currentSpeakerIndex++;
                            if (currentSpeakerIndex < speakers.length) {
                                speakers[currentSpeakerIndex].isActive = true;
                                updateSpeakersList();
                            } else {
                                stopTimer();
                            }
                        } else {
                            isRunning = false;
                            clearInterval(timerInterval);
                            updateSpeakersList();
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
    updateSpeakersList();
}

function resetTimer() {
    stopTimer();
    currentSpeakerIndex = -1;
    speakers.forEach(speaker => {
        speaker.remaining = speaker.time;
        speaker.isActive = false;
    });
    updateSpeakersList();
    updateTotalTime();
}

function removeSpeaker(index) {
    speakers.splice(index, 1);
    updateSpeakersList();
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
    const timersToSave = speakers.map(speaker => ({
        name: speaker.name,
        time: speaker.time / 60
    }));
    
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
            speakers = timers.map(timer => ({
                name: timer.name,
                time: timer.time * 60,
                remaining: timer.time * 60,
                isActive: false
            }));
            updateSpeakersList();
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
    const totalTimeCard = document.querySelector('.col-md-6:nth-child(2)');
    totalTimeCard.style.display = showTotalTime ? 'block' : 'none';
    localStorage.setItem('showTotalTime', showTotalTime);
}

function showSettingsDialog() {
    document.getElementById('settingsDialog').style.display = 'block';
}

function hideSettingsDialog() {
    document.getElementById('settingsDialog').style.display = 'none';
} 