let speakers = [];
let totalTime = 0;
let timerInterval;
let isRunning = false;
let currentSpeakerIndex = 0;

function addSpeaker() {
    const name = document.getElementById('speakerName').value;
    const time = parseInt(document.getElementById('speakerTime').value);
    
    if (name && time > 0) {
        speakers.push({
            name: name,
            time: time * 60,
            remaining: time * 60,
            isActive: false
        });
        
        updateSpeakersList();
        updateTotalTime();
        initSortable();
        
        document.getElementById('speakerName').value = '';
        document.getElementById('speakerTime').value = '';
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
        card.className = 'col-md-4 mb-3 speaker-card';
        if (speaker.isActive) {
            card.classList.add('active-speaker');
        }
        card.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${speaker.name}</h5>
                    <div class="text-center">
                        <h3 class="time-display" id="time-${index}">${formatTime(speaker.remaining)}</h3>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removeSpeaker(${index})">Entfernen</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateTotalTime() {
    totalTime = speakers.reduce((sum, speaker) => sum + speaker.time, 0);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning && speakers.length > 0) {
        isRunning = true;
        currentSpeakerIndex = 0;
        speakers[0].isActive = true;
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        
        timerInterval = setInterval(() => {
            if (currentSpeakerIndex < speakers.length) {
                const currentSpeaker = speakers[currentSpeakerIndex];
                
                if (currentSpeaker.remaining > 0) {
                    currentSpeaker.remaining--;
                    totalTime--;
                    document.getElementById(`time-${currentSpeakerIndex}`).textContent = formatTime(currentSpeaker.remaining);
                    document.getElementById('totalTime').textContent = formatTime(totalTime);
                } else {
                    currentSpeaker.isActive = false;
                    currentSpeakerIndex++;
                    if (currentSpeakerIndex < speakers.length) {
                        speakers[currentSpeakerIndex].isActive = true;
                    } else {
                        stopTimer();
                    }
                    updateSpeakersList();
                }
            } else {
                stopTimer();
            }
        }, 1000);
    }
}

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    speakers.forEach(speaker => speaker.isActive = false);
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
    updateSpeakersList();
}

function resetTimer() {
    stopTimer();
    currentSpeakerIndex = 0;
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