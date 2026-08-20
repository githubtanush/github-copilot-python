let currentPuzzle = [];
let currentSolution = [];
let timerInterval = null;
let secondsElapsed = 0;
let hintsUsed = 0;
let currentDifficulty = 'medium';

const gridElement = document.getElementById('sudokuGrid');
const timerDisplay = document.getElementById('timerDisplay');
const statusMessage = document.getElementById('statusMessage');
const difficultySelect = document.getElementById('difficultySelect');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const leaderboardBody = document.getElementById('leaderboardBody');

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('sudoku-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

if (localStorage.getItem('sudoku-theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Timer Functions
function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Start New Game
async function initGame() {
    currentDifficulty = difficultySelect.value;
    hintsUsed = 0;
    statusMessage.textContent = 'Loading new puzzle...';
    statusMessage.style.color = '#0984e3';

    try {
        const res = await fetch(`/api/new-game?difficulty=${currentDifficulty}`);
        const data = await res.json();
        
        currentPuzzle = data.puzzle;
        currentSolution = data.solution;
        renderBoard(currentPuzzle);
        startTimer();
        statusMessage.textContent = '';
        renderLeaderboard();
    } catch (err) {
        statusMessage.textContent = 'Failed to load puzzle.';
        statusMessage.style.color = '#d63031';
    }
}

// Render 9x9 Board with Alternating 3x3 Blocks
function renderBoard(puzzle) {
    gridElement.innerHTML = '';

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            // Alternating 3x3 block pattern (Checkerboard style)
            const blockRow = Math.floor(r / 3);
            const blockCol = Math.floor(c / 3);
            if ((blockRow + blockCol) % 2 === 1) {
                cellDiv.classList.add('block-alt');
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.dataset.row = r;
            input.dataset.col = c;

            if (puzzle[r][c] !== 0) {
                input.value = puzzle[r][c];
                input.readOnly = true;
                cellDiv.classList.add('prefilled');
            } else {
                cellDiv.classList.add('user-input');
                input.addEventListener('input', (e) => handleCellInput(e, r, c));
            }

            cellDiv.appendChild(input);
            gridElement.appendChild(cellDiv);
        }
    }
}

// Validate Move on User Input
async function handleCellInput(e, row, col) {
    const val = e.target.value;
    const parentCell = e.target.parentElement;
    parentCell.classList.remove('invalid-conflict');

    if (!/^[1-9]$/.test(val)) {
        e.target.value = '';
        return;
    }

    const currentBoard = getCurrentBoardState();
    const res = await fetch('/api/validate-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: currentBoard, row: row, col: col, num: parseInt(val) })
    });
    const result = await res.json();

    if (!result.is_valid) {
        parentCell.classList.add('invalid-conflict');
        statusMessage.textContent = 'Conflict detected!';
        statusMessage.style.color = '#d63031';
    } else {
        statusMessage.textContent = '';
        checkBoardCompletion();
    }
}

function getCurrentBoardState() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    const inputs = gridElement.querySelectorAll('input');
    inputs.forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const val = parseInt(input.value);
        board[r][c] = isNaN(val) ? 0 : val;
    });
    return board;
}

// Check Button Action
document.getElementById('checkBtn').addEventListener('click', () => {
    const inputs = gridElement.querySelectorAll('input');
    let hasMistake = false;

    inputs.forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const val = parseInt(input.value);
        const parent = input.parentElement;

        parent.classList.remove('invalid-conflict');
        if (!isNaN(val) && val !== currentSolution[r][c]) {
            parent.classList.add('invalid-conflict');
            hasMistake = true;
        }
    });

    if (hasMistake) {
        statusMessage.textContent = 'Incorrect entries highlighted in red!';
        statusMessage.style.color = '#d63031';
    } else {
        statusMessage.textContent = 'Looking good! No mistakes found.';
        statusMessage.style.color = '#00b894';
    }
});

// Hint Button Action
document.getElementById('hintBtn').addEventListener('click', () => {
    const inputs = Array.from(gridElement.querySelectorAll('input'));
    const emptyInputs = inputs.filter(inp => inp.value === '');

    if (emptyInputs.length === 0) return;

    const randomCell = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
    const r = parseInt(randomCell.dataset.row);
    const c = parseInt(randomCell.dataset.col);

    randomCell.value = currentSolution[r][c];
    randomCell.readOnly = true;
    randomCell.parentElement.classList.remove('user-input');
    randomCell.parentElement.classList.add('hint-locked');
    hintsUsed++;

    checkBoardCompletion();
});

// Check Completion & Leaderboard Storage
function checkBoardCompletion() {
    const board = getCurrentBoardState();
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== currentSolution[r][c]) return;
        }
    }

    stopTimer();
    statusMessage.textContent = '🎉 Congratulations! You solved the Sudoku!';
    statusMessage.style.color = '#00b894';

    const playerName = prompt('Congratulations! Enter your name for the leaderboard:') || 'Anonymous';
    saveScore(playerName, secondsElapsed, currentDifficulty, hintsUsed);
    renderLeaderboard();
}

function saveScore(name, time, difficulty, hints) {
    const scores = JSON.parse(localStorage.getItem('sudoku-scores') || '[]');
    scores.push({ name, time, difficulty, hints, date: new Date().toISOString() });
    scores.sort((a, b) => a.time - b.time);
    localStorage.setItem('sudoku-scores', JSON.stringify(scores.slice(0, 10)));
}

function renderLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('sudoku-scores') || '[]');
    leaderboardBody.innerHTML = '';

    if (scores.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No high scores yet!</td></tr>';
        return;
    }

    scores.forEach((s, idx) => {
        const mins = String(Math.floor(s.time / 60)).padStart(2, '0');
        const secs = String(s.time % 60).padStart(2, '0');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${idx + 1}</td>
            <td>${s.name}</td>
            <td>${mins}:${secs}</td>
            <td>${s.difficulty}</td>
            <td>${s.hints}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Event Listeners
document.getElementById('newGameBtn').addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);

// Load on Startup
window.addEventListener('DOMContentLoaded', initGame);