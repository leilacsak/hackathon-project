/* jshint esversion: 8 */

const CONFIG = {
    GRID_SIZE: 12,
    DEFAULT_LENGTH: 8,
    DISPLAY_TIME: 2000,
    CELL_COUNT: 144,
    TIME_PER_STEP: 2
};

const grid = document.getElementById("grid");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const statusMsg = document.getElementById("status-message");
const modal = document.getElementById("instructions-modal");
const instBtn = document.getElementById("instructions-btn");
const closeBtn = document.querySelector(".close-btn");
const lengthInput = document.getElementById("length");
const diffVal = document.getElementById("diff-val");
const timedModeToggle = document.getElementById("timed-mode");
const timerDisplay = document.getElementById("timer-display");

let gamePath = [];
let userPath = [];
let tiles = [];
let isShowingPath = false;
let isPlayerTurn = false;
let secondsElapsed = 0;
let timeRemaining = 0;
let timerInterval = null;
let isTimedMode = false;

/**
 * Fixes the "Functions declared within loops" warning by 
 * providing a static scope for the event listeners.
 */
function attachTileListeners(tile, index) {
    tile.addEventListener("click", () => handleTileClick(index));

    tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTileClick(index);
        }
    });
}

function createGrid() {
    grid.innerHTML = "";
    tiles = [];

    for (let i = 0; i < CONFIG.CELL_COUNT; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        
        tile.dataset.index = i;
        
        tile.setAttribute("tabindex", "0"); 
        tile.setAttribute("role", "button");
        tile.setAttribute("aria-label", `Tile ${i + 1}`);

        attachTileListeners(tile, i);

        grid.appendChild(tile);
        tiles.push(tile);
    }
}

function generatePath(length = CONFIG.DEFAULT_LENGTH) {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        const path = [];
        const visited = new Set();
        
        let current = Math.floor(CONFIG.CELL_COUNT / 2) + Math.floor(CONFIG.GRID_SIZE / 2);
        
        path.push(current);
        visited.add(current);

        while (path.length < length) {
            const neighbors = getValidNeighbors(current, visited);
            if (neighbors.length === 0) {
                break;
            }

            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            path.push(next);
            visited.add(next);
            current = next;
        }

        if (path.length === length) {
            return path;
        }
    }
    
    statusMsg.innerText = "Error generating path. Please try again.";
    return [];
}

function getValidNeighbors(index, visited) {
    const neighbors = [];
    const row = Math.floor(index / CONFIG.GRID_SIZE);
    const col = index % CONFIG.GRID_SIZE;

    if (row > 0) {
        neighbors.push(index - CONFIG.GRID_SIZE);
    }
    if (row < CONFIG.GRID_SIZE - 1) {
        neighbors.push(index + CONFIG.GRID_SIZE);
    }
    if (col > 0) {
        neighbors.push(index - 1);
    }
    if (col < CONFIG.GRID_SIZE - 1) {
        neighbors.push(index + 1);
    }

    return neighbors.filter(n => !visited.has(n));
}

function startTimer(duration) {
    stopTimer();
    
    if (isTimedMode && duration) {
        timeRemaining = duration;
        timerDisplay.innerText = `Time Left: ${timeRemaining}s`;
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            timerDisplay.innerText = `Time Left: ${timeRemaining}s`;
            
            if (timeRemaining <= 0) {
                handleTimeout();
            }
        }, 1000);
    } else {
        timerDisplay.innerText = "";
        secondsElapsed = 0;
        timerInterval = setInterval(() => {
            secondsElapsed++;
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = null;
}

function handleTimeout() {
    stopTimer();
    isPlayerTurn = false;
    statusMsg.innerText = "Time's up! Attempt failed.";
    tiles.forEach(t => t.classList.add("disabled")); 
}

// Helper to avoid function declarations inside loops referencing outer variables
function activateTile(index) {
    return new Promise((resolve) => {
        setTimeout(() => {
            tiles[index].classList.add("active");
            resolve();
        }, 200);
    });
}

async function startGame() {
    if (isShowingPath) {
        return;
    }

    stopTimer();
    userPath = [];
    isPlayerTurn = false;
    isTimedMode = timedModeToggle ? timedModeToggle.checked : false;

    tiles.forEach(t => t.classList.remove("active", "wrong", "disabled"));
    
    const length = parseInt(lengthInput.value, 10) || CONFIG.DEFAULT_LENGTH;
    gamePath = generatePath(length);
    
    if (gamePath.length > 0) {
        await showPathToMemorise();
    }
}

async function showPathToMemorise() {
    isShowingPath = true;
    statusMsg.innerText = "Memorize the sequence...";

    for (const index of gamePath) {
        await activateTile(index);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.DISPLAY_TIME));

    for (const index of gamePath) {
        tiles[index].classList.remove("active");
    }

    isShowingPath = false;
    isPlayerTurn = true;
    statusMsg.innerText = "Your turn! Repeat the path.";

    if (isTimedMode) {
        startTimer(gamePath.length * CONFIG.TIME_PER_STEP);
    } else {
        startTimer();
    }
}

function handleTileClick(index) {
    if (!isPlayerTurn || isShowingPath) {
        return;
    }

    const expectedIndex = gamePath[userPath.length];

    if (index === expectedIndex) {
        tiles[index].classList.add("active");
        userPath.push(index);

        if (userPath.length === gamePath.length) {
            stopTimer();
            isPlayerTurn = false;
            statusMsg.innerText = isTimedMode ?
                `Success! ${timeRemaining}s remaining.` :
                `Success! Finished in ${secondsElapsed}s.`;
        }
    } else {
        stopTimer();
        tiles[index].classList.add("wrong");
        statusMsg.innerText = "Incorrect! Press 'Reset Attempt' to try again.";
        isPlayerTurn = false;
    }
}

function resetAttempt() {
    if (gamePath.length === 0) {
        return;
    }

    userPath = [];
    isPlayerTurn = true;
    statusMsg.innerText = "Attempt reset! Try again...";

    tiles.forEach(t => t.classList.remove("active", "wrong", "disabled"));

    if (isTimedMode) {
        startTimer(gamePath.length * CONFIG.TIME_PER_STEP);
    } else {
        startTimer();
    }
}

instBtn.onclick = () => {
    modal.style.display = "block";
    closeBtn.focus();
};

closeBtn.onclick = () => {
    modal.style.display = "none";
    instBtn.focus();
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

lengthInput.addEventListener("input", (e) => {
    diffVal.textContent = e.target.value;
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetAttempt);

createGrid();
