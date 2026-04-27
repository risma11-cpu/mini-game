/* ==============================
   CONFIGURATION & STATE
   ============================== */
const EMOJIS = [
    '🐶','🐱','🐰','🦊','🐻','🐼','🐸','🦁',
    '🐯','🐮','🐷','🦄','🐝','🌟','🍎','🍕',
    '🎈','🚀','🎯','🎨','🍰','🌈','🎵','🎪'
];

const DIFFICULTIES = {
    easy:   { cols: 4, rows: 3, pairs: 6,  label: 'Easy' },
    medium: { cols: 4, rows: 4, pairs: 8,  label: 'Medium' },
    hard:   { cols: 5, rows: 4, pairs: 10, label: 'Hard' }
};

const LEVEL_ORDER = ['easy', 'medium', 'hard'];

let state = {
    difficulty: 'easy',
    cards: [],
    flippedIndices: [],
    matchedPairs: 0,
    totalPairs: 6,
    moves: 0,
    score: 0,
    combo: 0,
    timerSeconds: 0,
    timerInterval: null,
    isLocked: false,
    gameStarted: false
};

let audioCtx = null;
let soundEnabled = true;

/* ==============================
   AUDIO (Web Audio API)
   ============================== */
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx || !soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);

    switch (type) {
        case 'flip': {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.connect(g); g.connect(masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
            g.gain.setValueAtTime(0.12, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
            break;
        }
        case 'match': {
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'sine';
                const t = now + i * 0.1;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.start(t); osc.stop(t + 0.2);
            });
            break;
        }
        case 'mismatch': {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.connect(g); g.connect(masterGain);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
            g.gain.setValueAtTime(0.12, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
            break;
        }
        case 'win': {
            [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'triangle';
                const t = now + i * 0.13;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                osc.start(t); osc.stop(t + 0.28);
            });
            break;
        }
        case 'combo': {
            [784, 988, 1175].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'sine';
                const t = now + i * 0.06;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                osc.start(t); osc.stop(t + 0.12);
            });
            break;
        }
        case 'start': {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'sine';
                const t = now + i * 0.12;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.start(t); osc.stop(t + 0.25);
            });
            break;
        }
        case 'levelUp': {
            [659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'triangle';
                const t = now + i * 0.1;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.start(t); osc.stop(t + 0.3);
            });
            break;
        }
        case 'allClear': {
            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(masterGain);
                osc.type = 'triangle';
                const t = now + i * 0.15;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                osc.start(t); osc.stop(t + 0.4);
            });
            break;
        }
    }
}

/* ==============================
   BACKGROUND MUSIC (BGM)
   ============================== */
let bgmPlaying = false;
let bgmTimer = null;
let bgmNodes = [];
let firstInteraction = false;

function startBGM() {
    if (bgmPlaying || !soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            bgmPlaying = true;
            playBGMLoop();
        });
    } else {
        bgmPlaying = true;
        playBGMLoop();
    }
}

function stopBGM() {
    bgmPlaying = false;
    if (bgmTimer) clearTimeout(bgmTimer);
    bgmTimer = null;
    bgmNodes.forEach(n => { try { n.stop(); } catch(e){} });
    bgmNodes = [];
}

function playBGMLoop() {
    if (!bgmPlaying || !soundEnabled || !audioCtx) {
        bgmPlaying = false;
        return;
    }

    const now = audioCtx.currentTime + 0.05;
    let t = now;

    const melody = [
        { f: 523.25, d: 0.28, g: 0.14 },
        { f: 659.25, d: 0.28, g: 0.14 },
        { f: 783.99, d: 0.28, g: 0.14 },
        { f: 659.25, d: 0.28, g: 0.14 },
        { f: 880.00, d: 0.45, g: 0.18 },
        { f: 783.99, d: 0.28, g: 0.14 },
        { f: 659.25, d: 0.28, g: 0.14 },
        { f: 523.25, d: 0.45, g: 0.28 },
        { f: 392.00, d: 0.28, g: 0.14 },
        { f: 523.25, d: 0.28, g: 0.14 },
        { f: 659.25, d: 0.28, g: 0.14 },
        { f: 523.25, d: 0.28, g: 0.14 },
        { f: 783.99, d: 0.45, g: 0.18 },
        { f: 659.25, d: 0.28, g: 0.14 },
        { f: 523.25, d: 0.28, g: 0.14 },
        { f: 392.00, d: 0.45, g: 0.45 }
    ];

    melody.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.055, t + 0.04);
        gain.gain.setValueAtTime(0.055, t + note.d - 0.04);
        gain.gain.linearRampToValueAtTime(0, t + note.d);
        osc.start(t);
        osc.stop(t + note.d + 0.01);
        bgmNodes.push(osc);
        t += note.d + note.g;
    });

    const loopDur = t - now;

    const bassLine = [
        { f: 130.81, s: 0,      d: 3.8  },
        { f: 110.00, s: 3.8,    d: 2.8  },
        { f: 98.00,  s: 6.6,    d: 2.0  }
    ];

    bassLine.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        const nt = now + note.s;
        osc.frequency.setValueAtTime(note.f, nt);
        gain.gain.setValueAtTime(0, nt);
        gain.gain.linearRampToValueAtTime(0.035, nt + 0.06);
        gain.gain.setValueAtTime(0.035, nt + note.d - 0.06);
        gain.gain.linearRampToValueAtTime(0, nt + note.d);
        osc.start(nt);
        osc.stop(nt + note.d + 0.01);
        bgmNodes.push(osc);
    });

    const padChords = [
        { freqs: [261.63, 329.63, 392.00], s: 0,    d: 3.8 },
        { freqs: [220.00, 261.63, 329.63], s: 3.8,  d: 2.8 },
        { freqs: [196.00, 246.94, 293.66], s: 6.6,  d: 2.0 }
    ];

    padChords.forEach(chord => {
        chord.freqs.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            const nt = now + chord.s;
            osc.frequency.setValueAtTime(freq, nt);
            gain.gain.setValueAtTime(0, nt);
            gain.gain.linearRampToValueAtTime(0.018, nt + 0.3);
            gain.gain.setValueAtTime(0.018, nt + chord.d - 0.3);
            gain.gain.linearRampToValueAtTime(0, nt + chord.d);
            osc.start(nt);
            osc.stop(nt + chord.d + 0.01);
            bgmNodes.push(osc);
        });
    });

    bgmTimer = setTimeout(() => {
        bgmNodes = [];
        playBGMLoop();
    }, loopDur * 1000);
}

/* ==============================
   MOBILE AUDIO UNLOCK
   ============================== */
function unlockAudio() {
    if (firstInteraction) return;
    firstInteraction = true;

    initAudio();

    // Warm-up: putar nada super pendek & pelan buat "buka" audio context di HP
    // Tanpa ini, Safari iOS & Chrome Android sering nolak audio berikutnya
    try {
        const warmUp = audioCtx.createOscillator();
        const warmGain = audioCtx.createGain();
        warmUp.connect(warmGain);
        warmGain.connect(audioCtx.destination);
        warmUp.type = 'sine';
        warmUp.frequency.setValueAtTime(440, audioCtx.currentTime);
        warmGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        warmUp.start(audioCtx.currentTime);
        warmUp.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}

    // BGM mulai setelah warm-up selesai
    setTimeout(() => {
        startBGM();
    }, 100);
}

// touchstart buat HP (lebih pertama dari click), click buat desktop
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
document.addEventListener('click', unlockAudio, { once: true });

/* ==============================
   DOM REFERENCES
   ============================== */
const heroSection = document.getElementById('heroSection');
const gameSection = document.getElementById('gameSection');
const gameGrid = document.getElementById('gameGrid');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const soundToggle = document.getElementById('soundToggle');
const toastEl = document.getElementById('toast');
const victoryOverlay = document.getElementById('victoryOverlay');
const playAgainBtn = document.getElementById('playAgainBtn');
const victoryMenuBtn = document.getElementById('victoryMenuBtn');
const bestBadge = document.getElementById('bestBadge');
const bestText = document.getElementById('bestText');
const diffCards = document.querySelectorAll('.diff-card');

const movesVal = document.getElementById('movesVal');
const matchesVal = document.getElementById('matchesVal');
const timerVal = document.getElementById('timerVal');
const scoreVal = document.getElementById('scoreVal');

/* ==============================
   BACKGROUND SHAPES
   ============================== */
function createBgShapes() {
    const container = document.getElementById('bgShapes');
    const colors = ['#4FC3F7', '#FFD54F', '#FF6B9D', '#66BB6A', '#FF9800'];
    for (let i = 0; i < 12; i++) {
        const s = document.createElement('div');
        s.classList.add('floating-shape');
        const size = 60 + Math.random() * 100;
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        s.style.background = colors[i % colors.length];
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.setProperty('--dur', (12 + Math.random() * 10) + 's');
        s.style.animationDelay = -(Math.random() * 15) + 's';
        container.appendChild(s);
    }
}
createBgShapes();

/* ==============================
   DIFFICULTY SELECTION
   ============================== */
diffCards.forEach(card => {
    card.addEventListener('click', () => {
        diffCards.forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        state.difficulty = card.dataset.diff;
        showBestScore();
        initAudio();
        playSound('flip');
    });
});

function showBestScore() {
    const best = getBestScore(state.difficulty);
    if (best) {
        bestBadge.style.display = 'flex';
        bestText.textContent = `Best Score: ${best}`;
    } else {
        bestBadge.style.display = 'none';
    }
}
showBestScore();

/* ==============================
   SOUND TOGGLE
   ============================== */
soundToggle.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    soundToggle.innerHTML = soundEnabled
        ? '<i class="fas fa-volume-high"></i>'
        : '<i class="fas fa-volume-xmark"></i>';
    if (soundEnabled) {
        firstInteraction = true;
        startBGM();
    } else {
        stopBGM();
    }
});

/* ==============================
   GAME LOGIC
   ============================== */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startGame() {
    initAudio();
    playSound('start');
    const diff = DIFFICULTIES[state.difficulty];
    state.totalPairs = diff.pairs;
    state.matchedPairs = 0;
    state.moves = 0;
    state.score = 0;
    state.combo = 0;
    state.flippedIndices = [];
    state.isLocked = false;
    state.gameStarted = false;
    state.timerSeconds = 0;
    clearInterval(state.timerInterval);

    const chosenEmojis = shuffle(EMOJIS).slice(0, diff.pairs);
    const cardEmojis = shuffle([...chosenEmojis, ...chosenEmojis]);
    state.cards = cardEmojis;

    heroSection.classList.add('hidden');
    gameSection.classList.add('active');
    victoryOverlay.classList.remove('active');

    gameGrid.className = 'game-grid';
    if (diff.cols === 5) {
        gameGrid.classList.add('cols-5');
    } else {
        gameGrid.classList.add('cols-4');
    }

    renderCards();
    updateStats();
}

function renderCards() {
    gameGrid.innerHTML = '';
    state.cards.forEach((emoji, idx) => {
        const card = document.createElement('div');
        card.className = 'card entering';
        card.dataset.index = idx;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Card ${idx + 1}, face down`);
        card.setAttribute('tabindex', '0');
        card.style.animationDelay = (idx * 45) + 'ms';

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back">
                    <div class="card-back-dots"></div>
                    <span class="card-back-q">?</span>
                </div>
                <div class="card-face card-front">
                    <span class="card-emoji">${emoji}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => handleCardClick(idx));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(idx);
            }
        });

        gameGrid.appendChild(card);
    });
}

function handleCardClick(index) {
    if (state.isLocked) return;
    if (state.flippedIndices.includes(index)) return;
    const cardEl = gameGrid.children[index];
    if (!cardEl || cardEl.classList.contains('matched')) return;

    if (!state.gameStarted) {
        state.gameStarted = true;
        startTimer();
    }

    cardEl.classList.add('flipped');
    cardEl.setAttribute('aria-label', `Card ${index + 1}, showing ${state.cards[index]}`);
    state.flippedIndices.push(index);
    playSound('flip');

    if (state.flippedIndices.length === 2) {
        state.moves++;
        state.isLocked = true;
        checkMatch();
    }
}

function checkMatch() {
    const [i1, i2] = state.flippedIndices;
    const card1 = gameGrid.children[i1];
    const card2 = gameGrid.children[i2];

    if (state.cards[i1] === state.cards[i2]) {
        state.combo++;
        const bonus = state.combo >= 2 ? state.combo * 50 : 0;
        const matchScore = 100 + bonus;
        state.score += matchScore;
        state.matchedPairs++;

        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            playSound('match');

            spawnMatchParticles(card1);
            spawnMatchParticles(card2);

            if (state.combo >= 2) {
                playSound('combo');
                showToast(`${state.combo}x Combo! +${matchScore}`, 'var(--gold)');
            }

            state.flippedIndices = [];
            state.isLocked = false;
            updateStats();

            if (state.matchedPairs === state.totalPairs) {
                setTimeout(handleWin, 600);
            }
        }, 350);
    } else {
        state.combo = 0;
        playSound('mismatch');
        setTimeout(() => {
            card1.classList.add('shake');
            card2.classList.add('shake');
            setTimeout(() => {
                card1.classList.remove('flipped', 'shake');
                card2.classList.remove('flipped', 'shake');
                card1.setAttribute('aria-label', `Card ${i1 + 1}, face down`);
                card2.setAttribute('aria-label', `Card ${i2 + 1}, face down`);
                state.flippedIndices = [];
                state.isLocked = false;
            }, 450);
        }, 600);
        updateStats();
    }
}

function getNextLevel(currentDiff) {
    const idx = LEVEL_ORDER.indexOf(currentDiff);
    if (idx < LEVEL_ORDER.length - 1) {
        return LEVEL_ORDER[idx + 1];
    }
    return null;
}

function handleWin() {
    clearInterval(state.timerInterval);

    const nextLevel = getNextLevel(state.difficulty);
    const isAllClear = !nextLevel;

    if (isAllClear) {
        playSound('allClear');
    } else {
        playSound('win');
    }

    const timeBonus = Math.max(0, 300 - state.timerSeconds * 2);
    const efficiencyBonus = Math.max(0, (state.totalPairs * 3 - state.moves) * 25);
    state.score += timeBonus + efficiencyBonus;

    const isNewBest = saveBestScore(state.difficulty, state.score);
    const best = getBestScore(state.difficulty);

    const minMoves = state.totalPairs;
    const moveRatio = state.moves / minMoves;
    let stars = 1;
    if (moveRatio <= 1.5) stars = 3;
    else if (moveRatio <= 2.2) stars = 2;

    if (isAllClear) {
        document.getElementById('vTitle').textContent = 'All Levels Clear!';
        document.getElementById('vSubtitle').textContent = isNewBest
            ? 'Kamu menguasai semua level dengan skor terbaik!'
            : 'Kamu sudah menyelesaikan semua level!';
    } else {
        document.getElementById('vTitle').textContent = isNewBest ? 'New Record' : 'Congratulations';
        document.getElementById('vSubtitle').textContent = isNewBest
            ? 'You set a new personal best!'
            : 'Siap lanjut ke level berikutnya?';
    }
    document.getElementById('vStars').innerHTML = renderStars(stars);
    document.getElementById('vMoves').textContent = state.moves;
    document.getElementById('vTime').textContent = formatTime(state.timerSeconds);
    document.getElementById('vScore').textContent = state.score;
    document.getElementById('vBest').textContent = best;

    if (isAllClear) {
        playAgainBtn.innerHTML = '<i class="fas fa-redo"></i> Main Lagi';
    } else {
        playAgainBtn.innerHTML = '<i class="fas fa-forward"></i> Next Level';
    }

    victoryOverlay.classList.add('active');
    spawnConfetti();
    updateStats();
}

function renderStars(count) {
    let html = '';
    for (let i = 0; i < 3; i++) {
        html += `<span style="opacity:${i < count ? 1 : 0.2}; filter:${i < count ? 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' : 'none'};">&#11088;</span>`;
    }
    return html;
}

/* ==============================
   TIMER
   ============================== */
function startTimer() {
    clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        timerVal.textContent = formatTime(state.timerSeconds);
    }, 1000);
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ==============================
   UPDATE STATS
   ============================== */
function updateStats() {
    movesVal.textContent = state.moves;
    matchesVal.textContent = state.matchedPairs + '/' + state.totalPairs;
    scoreVal.textContent = state.score;
}

/* ==============================
   LOCAL STORAGE
   ============================== */
function saveBestScore(diff, score) {
    try {
        const key = 'memoryMatch_best_' + diff;
        const current = localStorage.getItem(key);
        if (!current || score > parseInt(current, 10)) {
            localStorage.setItem(key, score.toString());
            return true;
        }
    } catch (e) {}
    return false;
}

function getBestScore(diff) {
    try {
        const val = localStorage.getItem('memoryMatch_best_' + diff);
        return val ? parseInt(val, 10) : null;
    } catch (e) { return null; }
}

/* ==============================
   EFFECTS
   ============================== */
function spawnMatchParticles(cardEl) {
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#FFD54F', '#FF6B9D', '#66BB6A', '#4FC3F7', '#FF9800', '#E040FB'];

    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'match-particle';
        const size = 6 + Math.random() * 8;
        const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.3;
        const dist = 40 + Math.random() * 60;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }

    for (let i = 0; i < 4; i++) {
        const s = document.createElement('div');
        s.className = 'star-burst';
        const angle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
        const dist = 30 + Math.random() * 40;
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';
        s.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        s.textContent = '✦';
        s.style.color = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 700);
    }
}

function spawnConfetti() {
    const colors = ['#FFD54F', '#FF6B9D', '#66BB6A', '#4FC3F7', '#FF9800', '#E040FB', '#FFD700'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        const w = 6 + Math.random() * 8;
        const h = 10 + Math.random() * 14;
        c.style.width = w + 'px';
        c.style.height = h + 'px';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        const dur = 2 + Math.random() * 2.5;
        c.style.animationDuration = dur + 's';
        c.style.animationDelay = Math.random() * 1.5 + 's';
        c.style.setProperty('--rot', (360 + Math.random() * 720) + 'deg');
        document.body.appendChild(c);
        setTimeout(() => c.remove(), (dur + 2) * 1000);
    }
}

let toastTimeout = null;
function showToast(msg, color) {
    clearTimeout(toastTimeout);
    toastEl.textContent = msg;
    toastEl.style.color = color || 'var(--text)';
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 1800);
}

/* ==============================
   EVENT LISTENERS
   ============================== */
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', goToMenu);
playAgainBtn.addEventListener('click', () => {
    victoryOverlay.classList.remove('active');
    const nextLevel = getNextLevel(state.difficulty);
    if (nextLevel) {
        state.difficulty = nextLevel;
        playSound('levelUp');
        showToast(`Level ${DIFFICULTIES[nextLevel].label}!`, 'var(--green)');
    } else {
        state.difficulty = 'easy';
    }
    startGame();
});
victoryMenuBtn.addEventListener('click', () => {
    victoryOverlay.classList.remove('active');
    goToMenu();
});

function goToMenu() {
    clearInterval(state.timerInterval);
    gameSection.classList.remove('active');
    heroSection.classList.remove('hidden');
    showBestScore();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (victoryOverlay.classList.contains('active')) {
            victoryOverlay.classList.remove('active');
            goToMenu();
        } else if (gameSection.classList.contains('active')) {
            goToMenu();
        }
    }
});
