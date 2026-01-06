// Centralized game settings for easy tuning
const CONFIG = {
    GRID_SIZE: 12,          // Number of cells per row/column (12x12 grid)
    DEFAULT_LENGTH: 8,      // Default length of the generated path
    DISPLAY_TIME: 2000,     // Time (ms) the full path remains visible
    CELL_COUNT: 144         // Total number of cells (GRID_SIZE * GRID_SIZE)
};

// ===============================
// DOM element references
// ===============================
const grid = document.getElementById('grid');
const startBtn = document.getElementById('start-btn');
const statusMsg = document.getElementById('status-message');

// ===============================
// Game state variables
// ===============================
let gamePath = [];          // Stores the correct path the user must memorize
let userPath = [];          // Stores the user's input path
let tiles = [];             // Holds references to all grid tiles
let isShowingPath = false;  // True while the path animation is playing
let isInputEnabled = false; // Controls when user clicks are allowed

// ===============================
// Grid creation
// ===============================
function createGrid() {
    // Clear any existing grid content
    grid.innerHTML = '';
    tiles = [];

    // Create each tile dynamically
    for (let i = 0; i < CONFIG.CELL_COUNT; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');

        // Store tile index for reference
        tile.dataset.index = i;

        // Attach click handler for user interaction
        tile.addEventListener('click', () => handleTileClick(i));

        // Add tile to the grid and local array
        grid.appendChild(tile);
        tiles.push(tile);
    }
}

// ===============================
// Path generation logic
// ===============================
function generatePath(length = CONFIG.DEFAULT_LENGTH) {
    const path = [];

    // Start from a random cell within the grid
    let current = Math.floor(Math.random() * CONFIG.CELL_COUNT);
    path.push(current);

    // Continue until desired path length is reached
    while (path.length < length) {
        // Get all valid adjacent cells
        const neighbors = getValidNeighbors(current);

        // Randomly select one neighboring cell
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];

        path.push(next);
        current = next;
    }

    return path;
}

// Returns valid neighboring cells (up, down, left, right)
function getValidNeighbors(index) {
    const neighbors = [];

    // Convert linear index into row/column coordinates
    const row = Math.floor(index / CONFIG.GRID_SIZE);
    const col = index % CONFIG.GRID_SIZE;

    // Check boundaries before adding neighbors
    if (row > 0) neighbors.push(index - CONFIG.GRID_SIZE);               // Up
    if (row < CONFIG.GRID_SIZE - 1) neighbors.push(index + CONFIG.GRID_SIZE); // Down
    if (col > 0) neighbors.push(index - 1);                              // Left
    if (col < CONFIG.GRID_SIZE - 1) neighbors.push(index + 1);           // Right

    return neighbors;
}

// ===============================
// Game start logic
// ===============================
async function startGame() {
    // Reset user progress
    userPath = [];

    // Clear any previous visual states
    tiles.forEach(t => t.classList.remove('active', 'wrong'));

    // Get desired path length from user input (fallback to default)
    const lengthInput = document.getElementById('length').value;
    gamePath = generatePath(parseInt(lengthInput) || CONFIG.DEFAULT_LENGTH);

    // Show the generated path to the user
    await showPathToMemorise();
}

// ===============================
// Path display animation
// ===============================
async function showPathToMemorise() {
    isShowingPath = true;
    isInputEnabled = false; // Prevent user input during animation
    statusMsg.innerText = "Memorize the sequence...";

    // Highlight each tile in sequence with a staggered delay
    for (let i = 0; i < gamePath.length; i++) {
        setTimeout(() => {
            tiles[gamePath[i]].classList.add('active');
        }, i * 100);
    }

    // Total time = animation duration + fixed display time
    const totalWaitTime = (gamePath.length * 100) + CONFIG.DISPLAY_TIME;

    // Pause execution until the path display finishes
    await new Promise(resolve => setTimeout(resolve, totalWaitTime));

    // Remove all highlights after display ends
    gamePath.forEach(index => tiles[index].classList.remove('active'));

    // Enable user interaction
    isShowingPath = false;
    isInputEnabled = true;
    statusMsg.innerText = "Your turn! Replicate the sequence.";
}

// ===============================
// User input handling
// ===============================
function handleTileClick(index) {
    // Ignore clicks if input is disabled or path is still showing
    if (!isInputEnabled || isShowingPath) return;

    // Determine the expected tile for the current step
    const expectedIndex = gamePath[userPath.length];

    if (index === expectedIndex) {
        // Correct selection
        tiles[index].classList.add('active');
        userPath.push(index);

        // Check if user has completed the entire sequence
        if (userPath.length === gamePath.length) {
            statusMsg.innerText = "Perfect! Level Complete.";
            isInputEnabled = false;
        }
    } else {
        // Incorrect selection
        tiles[index].classList.add('wrong');
        statusMsg.innerText = "Incorrect! Press Start to try again.";
        isInputEnabled = false;
    }
}

// ===============================
// Initialization
// ===============================
startBtn.addEventListener('click', startGame);
createGrid();
