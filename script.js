// Data dan State Aplikasi
const appState = {
    currentQueue: null,
    nextQueue: 102,
    history: [],
    operators: [
        { id: 1, name: "Operator 1 - Sirkulasi", status: "available", currentQueue: null },
        { id: 2, name: "Operator 2 - Referensi", status: "available", currentQueue: null },
        { id: 3, name: "Operator 3 - Keanggotaan", status: "available", currentQueue: null },
        { id: 4, name: "Operator 4 - Digital", status: "available", currentQueue: null },
        { id: 5, name: "Operator 5 - Anak", status: "available", currentQueue: null },
        { id: 6, name: "Operator 6 - Koleksi", status: "available", currentQueue: null },
        { id: 7, name: "Operator 7 - Reservasi", status: "available", currentQueue: null },
        { id: 8, name: "Operator 8 - Khusus", status: "available", currentQueue: null }
    ],
    selectedOperator: "Operator 1 - Sirkulasi",
    stats: {
        totalCalled: 0,
        totalWaitTime: 0,
        busyOperators: 0
    }
};

// Inisialisasi Speech Synthesis
let speechSynth = window.speechSynthesis;
let voices = [];
let selectedVoice = null;
let voiceVolume = 0.8;
let voiceRate = 1.0;

// DOM Elements
const queueNumberInput = document.getElementById('queueNumber');
const operatorsGrid = document.getElementById('operatorsGrid');
const callQueueBtn = document.getElementById('callQueueBtn');
const repeatBtn = document.getElementById('repeatBtn');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const resetBtn = document.getElementById('resetBtn');
const currentQueueNumber = document.getElementById('currentQueueNumber');
const currentOperator = document.getElementById('currentOperator');
const nextQueueNumber = document.getElementById('nextQueueNumber');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const statusGrid = document.getElementById('statusGrid');
const totalCalledElement = document.getElementById('totalCalled');
const avgWaitTimeElement = document.getElementById('avgWaitTime');
const busyOperatorsElement = document.getElementById('busyOperators');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const testVoiceBtn = document.getElementById('testVoiceBtn');
const notificationSound = document.getElementById('notificationSound');
const dateElement = document.getElementById('date');
const timeElement = document.getElementById('time');

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', function() {
    initSpeechSynthesis();
    initOperatorsGrid();
    initStatusGrid();
    updateDateTime();
    loadFromLocalStorage();
    
    // Event Listeners
    callQueueBtn.addEventListener('click', callQueue);
    repeatBtn.addEventListener('click', repeatAnnouncement);
    decreaseBtn.addEventListener('click', () => changeQueueNumber(-1));
    increaseBtn.addEventListener('click', () => changeQueueNumber(1));
    resetBtn.addEventListener('click', resetQueueNumber);
    clearHistoryBtn.addEventListener('click', clearHistory);
    testVoiceBtn.addEventListener('click', testVoice);
    
    volumeSlider.addEventListener('input', updateVolume);
    speedSlider.addEventListener('input', updateSpeed);
    
    // Update waktu setiap detik
    setInterval(updateDateTime, 1000);
    
    // Update stats
    updateStats();
});

// Inisialisasi Speech Synthesis
function initSpeechSynthesis() {
    // Tunggu hingga voices tersedia
    setTimeout(() => {
        voices = speechSynth.getVoices();
        
        // Cari voice wanita bahasa Indonesia
        selectedVoice = voices.find(voice => 
            voice.lang.includes('id') || 
            voice.lang.includes('ID')
        );
        
        // Jika tidak ada, gunakan default
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
        }
    }, 1000);
}

// Inisialisasi Grid Operator
function initOperatorsGrid() {
    operatorsGrid.innerHTML = '';
    appState.operators.forEach(operator => {
        const operatorOption = document.createElement('div');
        operatorOption.className = `operator-option ${appState.selectedOperator === operator.name ? 'selected' : ''}`;
        operatorOption.innerHTML = `
            <div class="operator-number">${operator.id}</div>
            <div class="operator-name">${operator.name}</div>
        `;
        
        operatorOption.addEventListener('click', () => {
            // Hapus selected dari semua
            document.querySelectorAll('.operator-option').forEach(el => {
                el.classList.remove('selected');
            });
            // Tambahkan selected ke yang diklik
            operatorOption.classList.add('selected');
            appState.selectedOperator = operator.name;
        });
        
        operatorsGrid.appendChild(operatorOption);
    });
}

// Inisialisasi Grid Status
function initStatusGrid() {
    statusGrid.innerHTML = '';
    appState.operators.forEach(operator => {
        const statusItem = document.createElement('div');
        statusItem.className = `status-item ${operator.status}`;
        statusItem.innerHTML = `
            <div class="status-number">${operator.id}</div>
            <div class="status-name">${operator.name.split(' - ')[0]}</div>
            <div class="status-indicator status-${operator.status}">
                ${operator.status === 'available' ? 'Tersedia' : 'Sibuk'}
            </div>
        `;
        statusGrid.appendChild(statusItem);
    });
}

// Update Tanggal dan Waktu
function updateDateTime() {
    const now = new Date();
    
    // Format tanggal
    const optionsDate = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = now.toLocaleDateString('id-ID', optionsDate);
    
    // Format waktu
    timeElement.textContent = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Panggil Antrian
function callQueue() {
    const queueNumber = parseInt(queueNumberInput.value);
    const operatorName = appState.selectedOperator;
    
    if (!queueNumber || queueNumber < 1) {
        alert("Nomor antrian tidak valid!");
        return;
    }
    
    // Mainkan suara notifikasi
    notificationSound.volume = voiceVolume;
    notificationSound.currentTime = 0;
    notificationSound.play();
    
    // Update data
    appState.currentQueue = queueNumber;
    appState.nextQueue = queueNumber + 1;
    
    // Update operator
    const operatorIndex = appState.operators.findIndex(op => op.name === operatorName);
    if (operatorIndex !== -1) {
        appState.operators[operatorIndex].status = "busy";
        appState.operators[operatorIndex].currentQueue = queueNumber;
        
        // Set timeout untuk mengembalikan status setelah 3 menit
        setTimeout(() => {
            appState.operators[operatorIndex].status = "available";
            appState.operators[operatorIndex].currentQueue = null;
            initStatusGrid();
            updateStats();
        }, 180000); // 3 menit
    }
    
    // Tambahkan ke riwayat
    const historyItem = {
        queueNumber: queueNumber,
        operator: operatorName,
        timestamp: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        date: new Date().toLocaleDateString('id-ID')
    };
    
    appState.history.unshift(historyItem);
    appState.stats.totalCalled++;
    
    // Update tampilan
    updateDisplay();
    initStatusGrid();
    updateHistory();
    updateStats();
    
    // Tunggu sebentar sebelum mengucapkan pengumuman
    setTimeout(() => {
        speakAnnouncement(queueNumber, operatorName);
    }, 1000);
    
    // Simpan ke localStorage
    saveToLocalStorage();
}

// Ucapkan Pengumuman
function speakAnnouncement(queueNumber, operatorName) {
    if (!speechSynth) {
        alert("Browser tidak mendukung text-to-speech!");
        return;
    }
    
    // Hentikan pengucapan sebelumnya
    speechSynth.cancel();
    
    // Sederhanakan nama operator untuk pengucapan
    const simpleOperatorName = operatorName.split(' - ')[0];
    
    // Buat teks pengumuman dalam bahasa Indonesia
    const announcementText = `Nomor antrian ${queueNumber}, silakan menuju ${simpleOperatorName}. Terima kasih.`;
    
    // Buat utterance
    const utterance = new SpeechSynthesisUtterance(announcementText);
    
    // Atur pengaturan suara
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.volume = voiceVolume;
    utterance.rate = voiceRate;
    utterance.pitch = 1.0;
    utterance.lang = 'id-ID';
    
    // Mulai pengucapan
    speechSynth.speak(utterance);
}

// Ulangi Pengumuman
function repeatAnnouncement() {
    if (appState.currentQueue) {
        const operatorIndex = appState.operators.findIndex(op => 
            op.currentQueue === appState.currentQueue
        );
        const operatorName = operatorIndex !== -1 ? 
            appState.operators[operatorIndex].name : 
            appState.selectedOperator;
        
        notificationSound.currentTime = 0;
        notificationSound.play();
        
        setTimeout(() => {
            speakAnnouncement(appState.currentQueue, operatorName);
        }, 1000);
    } else {
        alert("Belum ada antrian yang dipanggil!");
    }
}

// Update Tampilan
function updateDisplay() {
    currentQueueNumber.textContent = appState.currentQueue || '--';
    nextQueueNumber.textContent = appState.nextQueue;
    
    if (appState.currentQueue) {
        const operator = appState.operators.find(op => 
            op.currentQueue === appState.currentQueue
        );
        currentOperator.textContent = operator ? operator.name : appState.selectedOperator;
    } else {
        currentOperator.textContent = 'Operator 1 - Sirkulasi';
    }
}

// Update Riwayat
function updateHistory() {
    if (appState.history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">Belum ada riwayat panggilan</div>';
        return;
    }
    
    historyList.innerHTML = appState.history.map(item => `
        <div class="history-item">
            <div class="history-time">${item.timestamp}</div>
            <div class="history-number">#${item.queueNumber}</div>
            <div class="history-operator">${item.operator.split(' - ')[0]}</div>
        </div>
    `).join('');
}

// Update Statistik
function updateStats() {
    totalCalledElement.textContent = appState.stats.totalCalled;
    
    // Hitung rata-rata waktu tunggu (simulasi)
    const avgWaitTime = appState.stats.totalCalled > 0 ? 
        Math.floor(Math.random() * 8) + 2 : 0;
    avgWaitTimeElement.textContent = avgWaitTime;
    
    // Hitung operator sibuk
    const busyOperators = appState.operators.filter(op => 
        op.status === 'busy'
    ).length;
    busyOperatorsElement.textContent = busyOperators;
    appState.stats.busyOperators = busyOperators;
}

// Update Volume
function updateVolume() {
    voiceVolume = volumeSlider.value / 100;
    volumeValue.textContent = `${volumeSlider.value}%`;
    notificationSound.volume = voiceVolume;
}

// Update Kecepatan
function updateSpeed() {
    voiceRate = parseFloat(speedSlider.value);
    speedValue.textContent = `${speedSlider.value}x`;
}

// Uji Suara
function testVoice() {
    const testText = "Ini adalah uji suara sistem antrian perpustakaan.";
    const utterance = new SpeechSynthesisUtterance(testText);
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.volume = voiceVolume;
    utterance.rate = voiceRate;
    utterance.pitch = 1.0;
    utterance.lang = 'id-ID';
    
    speechSynth.speak(utterance);
}

// Ubah Nomor Antrian
function changeQueueNumber(change) {
    let currentValue = parseInt(queueNumberInput.value);
    let newValue = currentValue + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 999) newValue = 999;
    
    queueNumberInput.value = newValue;
}

// Reset Nomor Antrian
function resetQueueNumber() {
    queueNumberInput.value = 101;
}

// Hapus Riwayat
function clearHistory() {
    if (confirm("Apakah Anda yakin ingin menghapus semua riwayat pemanggilan?")) {
        appState.history = [];
        updateHistory();
        saveToLocalStorage();
    }
}

// Simpan ke LocalStorage
function saveToLocalStorage() {
    const saveData = {
        currentQueue: appState.currentQueue,
        nextQueue: appState.nextQueue,
        history: appState.history.slice(0, 20), // Simpan 20 terakhir
        stats: appState.stats,
        lastQueueNumber: parseInt(queueNumberInput.value),
        selectedOperator: appState.selectedOperator
    };
    localStorage.setItem('libraryQueueSystem', JSON.stringify(saveData));
}

// Load dari LocalStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('libraryQueueSystem');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        appState.currentQueue = data.currentQueue;
        appState.nextQueue = data.nextQueue || 102;
        appState.history = data.history || [];
        appState.stats = data.stats || { totalCalled: 0, busyOperators: 0 };
        appState.selectedOperator = data.selectedOperator || "Operator 1 - Sirkulasi";
        
        if (data.lastQueueNumber) {
            queueNumberInput.value = data.lastQueueNumber;
        }
        
        updateDisplay();
        updateHistory();
        updateStats();
        initOperatorsGrid();
    }
}

// Hotkeys untuk kemudahan penggunaan
document.addEventListener('keydown', function(e) {
    // Space untuk memanggil antrian
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        callQueue();
    }
    
    // R untuk mengulangi
    if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        repeatAnnouncement();
    }
    
    // T untuk uji suara
    if (e.code === 'KeyT' && e.ctrlKey) {
        e.preventDefault();
        testVoice();
    }
    
    // + untuk tambah nomor antrian
    if (e.code === 'Equal' && e.shiftKey) {
        e.preventDefault();
        changeQueueNumber(1);
    }
    
    // - untuk kurang nomor antrian
    if (e.code === 'Minus') {
        e.preventDefault();
        changeQueueNumber(-1);
    }
});

// Notifikasi suara
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}