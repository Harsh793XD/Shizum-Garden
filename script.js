// --- Global Variables and Constants ---
const defaultGridSize = 10;     // Default grid size
let gridSize = defaultGridSize; // Current grid size
const wordsToFind = ['SERENE', 'CALM', 'GARDEN', 'STONE', 'WATER', 'BAMBOO', 'ZEN', 'PEACE'];
let grid = [];                  // 2D array representing the word search grid
let placedWordsInfo = [];       // Stores { word, cells, startRow, startCol, direction } for placed words
let foundWords = new Set();     // Tracks found word strings
let isSelecting = false;        // Flag for mouse button down state during selection
let selection = [];             // Stores {row, col, element} of currently selected cells
let foundWordCount = 0;         // Counter for words found (for garden growth)

// Directions for word placement (Horizontal, Vertical, Diagonal Down-Right, Diagonal Down-Left)
const directions = [
    { name: 'H', rowDelta: 0, colDelta: 1 },
    { name: 'V', rowDelta: 1, colDelta: 0 },
    { name: 'D1', rowDelta: 1, colDelta: 1 },
    { name: 'D2', rowDelta: 1, colDelta: -1 }
];

// --- DOM Element References (cached for performance) ---
const gridContainer = document.getElementById('grid-container');
const wordListElement = document.getElementById('word-list');
const gardenVisualizationElement = document.getElementById('garden-visualization');
const mindfulnessPopupElement = document.getElementById('mindfulness-popup');
const foundSoundElement = document.getElementById('foundSound');

// ==========================================================================
// Game Setup and Initialization
// ==========================================================================

/**
 * Resets all game state variables and UI elements for a new game.
 */
function resetGameState() {
    console.log("DEBUG: Resetting game state");
    grid = [];
    placedWordsInfo = [];
    foundWords = new Set();
    isSelecting = false;
    selection = [];
    foundWordCount = 0;

    // Clear grid container visually
    if (gridContainer) {
        gridContainer.innerHTML = '';
        // Reset grid listener flag if it exists
        gridContainer.removeAttribute('data-listeners-added');
        console.log("DEBUG: Removed listener flag for reset");
    }

    // Clear word list visually
    if (wordListElement) {
        wordListElement.innerHTML = '';
    }

    // Reset garden visualization - ONLY remove stage classes. Base style is handled by CSS.
    if (gardenVisualizationElement) {
        gardenVisualizationElement.className = ''; // Removes all classes like growth-stage-X
        // NOTE: No inline style resets needed here, CSS handles the base look.
        console.log("DEBUG: Garden visualization classes reset.");
    }

    // Ensure mindfulness popup is hidden and reset its classes
    if (mindfulnessPopupElement) {
        mindfulnessPopupElement.classList.remove('show', 'win-message');
        // Clear any pending timeout from previous popups
         if (mindfulnessPopupElement.hideTimeout) {
            clearTimeout(mindfulnessPopupElement.hideTimeout);
            mindfulnessPopupElement.hideTimeout = null;
        }
        console.log("DEBUG: Mindfulness popup hidden and classes reset.");
    }
}

/**
 * Initializes an empty 2D grid array with null values.
 * @param {number} size - The dimension (width/height) of the grid.
 */
function initializeGrid(size) {
    grid = Array(size).fill(null).map(() => Array(size).fill(null));
}

/**
 * Checks if a word can be placed at the given position and direction.
 * Allows overlapping placement if the letters match.
 * @param {string} word - The word to check.
 * @param {number} row - Starting row index.
 * @param {number} col - Starting column index.
 * @param {object} direction - The direction object { rowDelta, colDelta }.
 * @returns {boolean} True if the word can be placed, false otherwise.
 */
function canPlaceWord(word, row, col, direction) {
    const len = word.length;
    for (let i = 0; i < len; i++) {
        const currentRow = row + i * direction.rowDelta;
        const currentCol = col + i * direction.colDelta;

        // Check grid bounds
        if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) {
            return false; // Out of bounds
        }

        // Check cell content (null is empty, otherwise must match letter)
        const cellContent = grid[currentRow][currentCol];
        if (cellContent !== null && cellContent !== word[i]) {
            return false; // Conflict with a different existing letter
        }
    }
    return true; // Space is valid (empty or matching letter)
}

/**
 * Places a word into the grid array and stores its placement information.
 * @param {string} word - The word to place.
 * @param {number} row - Starting row index.
 * @param {number} col - Starting column index.
 * @param {object} direction - The direction object { rowDelta, colDelta, name }.
 */
function placeWordInGrid(word, row, col, direction) {
    const len = word.length;
    const wordCells = []; // Keep track of cells for this specific word placement

    for (let i = 0; i < len; i++) {
        const currentRow = row + i * direction.rowDelta;
        const currentCol = col + i * direction.colDelta;
        grid[currentRow][currentCol] = word[i];
        wordCells.push({ row: currentRow, col: currentCol });
    }

    // Store details about the placed word
    placedWordsInfo.push({
        word: word,
        cells: wordCells, // Exact cells occupied
        startRow: row,    // Original start row
        startCol: col,    // Original start col
        direction: direction.name // Name of the direction (e.g., 'H', 'V')
    });
}

/**
 * Attempts to randomly place each word from the provided list into the grid.
 * @param {string[]} words - An array of words to place.
 */
function placeWords(words) {
    const maxAttemptsPerWord = 50; // Number of tries before giving up on a word
    let placedCount = 0;

    for (const word of words) {
        let placed = false;
        for (let attempt = 0; attempt < maxAttemptsPerWord && !placed; attempt++) {
            // Choose a random direction
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const len = word.length;

            // Calculate valid starting range based on direction and word length
            const rowDelta = direction.rowDelta;
            const colDelta = direction.colDelta;
            let minRow = 0;
            let maxRow = gridSize - 1;
            let minCol = 0;
            let maxCol = gridSize - 1;

            if (rowDelta > 0) maxRow = gridSize - len;
            // No need for rowDelta < 0 check as we only place downwards/rightwards for diagonal/vertical
            if (colDelta > 0) maxCol = gridSize - len;
            if (colDelta < 0) minCol = len - 1; // For Diagonal Down-Left

            // Prevent trying impossible positions (shouldn't happen with current directions, but good practice)
            if (maxRow < minRow || maxCol < minCol) continue;

            // Choose a random start position within the valid range
            const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
            const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

            // Check if placement is valid and place the word
            if (canPlaceWord(word, row, col, direction)) {
                placeWordInGrid(word, row, col, direction);
                placed = true;
                placedCount++;
            }
        } // End attempts for one word
    } // End loop through words

    if (placedCount < words.length) {
        console.warn(`WARNING: Only placed ${placedCount} out of ${words.length} words. Grid might be too small or words too conflicting.`);
    }
}

/**
 * Fills all null (empty) cells in the grid array with random uppercase letters.
 */
function fillEmptyCells() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (grid[row][col] === null) {
                grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

// ==========================================================================
// UI Display Functions
// ==========================================================================

/**
 * Renders the grid data into HTML elements inside the grid container.
 */
function displayGrid() {
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; // Clear previous grid

    // Set the CSS variable for grid dimensions
    gridContainer.style.setProperty('--grid-size', gridSize);

    // Create and append cell elements
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = row; // Store coordinates
            cell.dataset.col = col;
            cell.textContent = grid[row][col]; // Display the letter
            gridContainer.appendChild(cell);
        }
    }
}

/**
 * Renders the list of words to find in the UI.
 */
function displayWordList() {
    if (!wordListElement) return;
    wordListElement.innerHTML = ''; // Clear previous list

    // Populate list from the original wordsToFind array
    wordsToFind.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.id = `word-item-${word}`; // Unique ID for styling found words
        // Mark as found if already in the foundWords set (e.g., on restart)
        if (foundWords.has(word)) {
            li.classList.add('found-word');
        }
        wordListElement.appendChild(li);
    });
}

// ==========================================================================
// Game Logic and Interaction
// ==========================================================================

/**
 * Checks if two cell objects {row, col} are adjacent (horizontally, vertically, or diagonally).
 * @param {object} cell1 - The first cell {row, col}.
 * @param {object} cell2 - The second cell {row, col}.
 * @returns {boolean} True if cells are adjacent, false otherwise.
 */
function areCellsAdjacent(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    // Adjacent if row/col differ by at most 1, but not the exact same cell
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Plays an audio element, handling potential errors.
 * @param {HTMLAudioElement} audioElement - The audio element to play.
 */
function playAudio(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0; // Rewind to start
        audioElement.play().catch(err => {
            // Ignore common errors like user not interacting yet or aborting playback
            if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
                console.error(`Failed to play audio:`, err);
            }
        });
    } else {
        console.error(`Audio element not provided or not found.`);
    }
}

/**
 * Updates the garden visualization based on the number of words found.
 * Applies CSS classes ('growth-stage-1', 'growth-stage-2', etc.) for styling.
 */
function triggerGardenGrowth() {
    const growthPercent = foundWordCount / wordsToFind.length;
    console.log(`DEBUG: triggerGardenGrowth. Found: ${foundWordCount}, Growth%: ${growthPercent.toFixed(2)}`);
    console.log('DEBUG: Garden Element:', gardenVisualizationElement);

    if (gardenVisualizationElement) {
        let stageClass = '';
        // Remove previous stage classes cleanly before adding a new one
        gardenVisualizationElement.classList.remove('growth-stage-1', 'growth-stage-2', 'growth-stage-3');

        // Determine and apply the correct stage class based on progress
        if (growthPercent >= 0.8) {       // 80% for stage 3
            stageClass = 'growth-stage-3';
        } else if (growthPercent >= 0.4) { // 40% for stage 2
            stageClass = 'growth-stage-2';
        } else if (foundWordCount > 0) {   // Any word found for stage 1
            stageClass = 'growth-stage-1';
        }

        // Add the new class if one applies
        if (stageClass) {
            console.log(`DEBUG: Applying growth class: ${stageClass}`);
            gardenVisualizationElement.classList.add(stageClass);
            console.log('DEBUG: Classes after add:', gardenVisualizationElement.className);
        } else {
            console.log("DEBUG: No growth stage class to apply (found count might be 0).");
        }
    } else {
        console.error("DEBUG: gardenVisualizationElement not found!");
    }
}

/**
 * Returns a predefined mindfulness prompt based on the found word.
 * @param {string} word - The word that was just found.
 * @returns {string} The mindfulness prompt.
 */
function getMindfulnessPrompt(word) {
    const prompts = {
        SERENE: 'Embrace the serenity around you. How does it feel?',
        CALM: 'Find a moment of calm. Take a deep breath.',
        GARDEN: 'Picture a peaceful garden. What do you see?',
        STONE: 'Feel the strength of a stone. What grounds you?',
        WATER: 'Imagine flowing water. Let your thoughts flow freely.',
        BAMBOO: 'Be flexible like bamboo. What can you adapt to?',
        ZEN: 'Seek Zen in this moment. What brings you peace?',
        PEACE: 'Reflect on peace. Where do you find it in your life?'
    };
    // Return the specific prompt or a generic one if not found
    return prompts[word] || `Reflect on "${word}": What does this word mean to you?`;
}

/**
 * Shows the mindfulness moment popup with a message for the found word.
 * Hides automatically after a delay.
 * @param {string} word - The word that triggered the popup.
 */
function showMindfulnessMoment(word) {
    console.log(`DEBUG: showMindfulnessMoment called for word: ${word}`);
    if (mindfulnessPopupElement) {
        const prompt = getMindfulnessPrompt(word);
        mindfulnessPopupElement.innerHTML = `<p>${prompt}</p>`;
        mindfulnessPopupElement.classList.remove('win-message'); // Ensure it doesn't have win styling

        // Clear any existing timeout before starting a new one
        if (mindfulnessPopupElement.hideTimeout) {
            clearTimeout(mindfulnessPopupElement.hideTimeout);
        }

        // Show the popup
        mindfulnessPopupElement.classList.add('show');
        console.log("DEBUG: Added 'show' class to mindfulness popup.");

        // Set timeout to hide it again
        mindfulnessPopupElement.hideTimeout = setTimeout(() => {
            mindfulnessPopupElement.classList.remove('show');
            mindfulnessPopupElement.hideTimeout = null; // Clear the reference
            console.log("DEBUG: Removed 'show' class from mindfulness popup after timeout.");
        }, 5000); // 5 seconds display time
    } else {
        console.error("DEBUG: mindfulnessPopupElement not found!");
    }
}

/**
 * Checks if the number of found words matches the total number of words to find.
 * @returns {boolean} True if all words are found, false otherwise.
 */
function checkWinCondition() {
    const allFound = foundWords.size === wordsToFind.length;
    console.log(`DEBUG: checkWinCondition: found=${foundWords.size}, total=${wordsToFind.length}, Result=${allFound}`);
    return allFound;
}

/**
 * Displays the win message in the popup element and adds a "New Puzzle?" button.
 */
function displayWinMessage() {
    console.log("DEBUG: displayWinMessage function CALLED.");
    console.log("DEBUG: Mindfulness Popup Element:", mindfulnessPopupElement);

    if (mindfulnessPopupElement) {
        // Clear any pending hide timeout from mindfulness messages
        if (mindfulnessPopupElement.hideTimeout) {
            clearTimeout(mindfulnessPopupElement.hideTimeout);
            mindfulnessPopupElement.hideTimeout = null;
            console.log("DEBUG: Cleared pending mindfulness hide timeout.");
        }

        // Set the HTML content for the win message and restart button
        mindfulnessPopupElement.innerHTML = `
            <div class="win-message">
                <h3>Harmony Found.</h3>
                <p>Congratulations! You've discovered all the words.</p>
                <button id="new-puzzle-btn">New Puzzle?</button>
            </div>
        `;

        // Apply necessary classes for display and styling
        mindfulnessPopupElement.classList.remove('show'); // Remove just in case
        mindfulnessPopupElement.classList.add('show');    // Add 'show' to display
        mindfulnessPopupElement.classList.add('win-message'); // Add win-specific styles
        console.log("DEBUG: Added 'show' and 'win-message' classes to popup.");

        // Attach event listener to the newly created button
        const newPuzzleBtn = document.getElementById('new-puzzle-btn');
        if (newPuzzleBtn) {
            console.log("DEBUG: Adding onclick listener to New Puzzle button.");
            // Use .onclick for simplicity; ensures only one listener
            newPuzzleBtn.onclick = initGame; // Restart the game when clicked
        } else {
            console.error("DEBUG: New puzzle button not found after adding win message!");
        }
    } else {
        console.error("DEBUG: mindfulnessPopupElement not found when trying to display win message!");
    }
}

/**
 * Validates the current selection of cells against the list of words.
 * If a valid word is found, updates game state, UI, and checks for win condition.
 * Clears the selection styling afterwards.
 */
function validateSelection() {
    // Need at least 2 cells for a word
    if (selection.length < 2) {
        // If only one cell was clicked, just remove its selecting style
        if (selection.length === 1) {
            selection[0].element.classList.remove('selecting');
        }
        return; // Exit validation
    }

    // Get the selected word string (forward and reversed)
    const selectedWord = selection.map(cell => cell.element.textContent).join('');
    const reverseSelectedWord = selectedWord.split('').reverse().join('');
    let wordFound = null; // Store the matched word (if any)

    console.log(`DEBUG: Validating selection: "${selectedWord}" (Reverse: "${reverseSelectedWord}")`);

    // Check if the selected string (or its reverse) is a word we need to find
    if (wordsToFind.includes(selectedWord) && !foundWords.has(selectedWord)) {
        wordFound = selectedWord;
    } else if (wordsToFind.includes(reverseSelectedWord) && !foundWords.has(reverseSelectedWord)) {
        wordFound = reverseSelectedWord;
    }

    // --- Process if a valid, new word was found ---
    if (wordFound) {
        console.log(`DEBUG: Word found: ${wordFound}`);
        foundWordCount++;
        foundWords.add(wordFound); // Add to the set of found words

        // Update the word list UI
        const wordListItem = document.getElementById(`word-item-${wordFound}`);
        if (wordListItem) {
            wordListItem.classList.add('found-word');
        } else {
            console.warn(`DEBUG: Word list item not found for ID: word-item-${wordFound}`);
        }

        // Update the grid cells UI
        selection.forEach(cell => {
            cell.element.classList.add('found');      // Apply 'found' style
            cell.element.classList.remove('selecting'); // Remove 'selecting' style
        });

        // Provide feedback
        playAudio(foundSoundElement);
        triggerGardenGrowth();
        showMindfulnessMoment(wordFound);

        // Check if the game is won
        console.log(`DEBUG: Checking win condition after finding ${wordFound}.`);
        if (checkWinCondition()) {
            console.log("DEBUG: Win condition MET! Setting timeout for displayWinMessage.");
            // Delay win message slightly for effect
            setTimeout(displayWinMessage, 700);
        } else {
            console.log("DEBUG: Win condition NOT YET met.");
        }
    }
    // --- Process if the selection was invalid or already found ---
    else {
        console.log(`DEBUG: Invalid or already found word: "${selectedWord}"`);
        // Remove 'selecting' highlight from the cells (unless they are already 'found')
        selection.forEach(cell => {
            if (cell && cell.element && !cell.element.classList.contains('found')) {
                cell.element.classList.remove('selecting');
            }
        });
    }
}

// ==========================================================================
// Event Listener Setup
// ==========================================================================

/**
 * Adds mousedown, mouseover, and mouseup event listeners to the grid
 * container and document to handle word selection.
 * Uses a flag to prevent adding listeners multiple times.
 */
function addGridListeners() {
    if (!gridContainer) {
        console.error("DEBUG: gridContainer not found, cannot add listeners.");
        return;
    }

    // Prevent adding listeners if they already exist (e.g., after reset)
    if (gridContainer.hasAttribute('data-listeners-added')) {
        console.log("DEBUG: Listeners already added, skipping.");
        return;
    }

    // --- Mouse Down: Start selection ---
    gridContainer.addEventListener('mousedown', (e) => {
        // Start selection only if clicking on a grid cell
        if (e.target.classList.contains('grid-cell')) {
            e.preventDefault(); // Prevent default text selection behavior
            isSelecting = true;
            selection = []; // Clear previous selection
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const currentCell = { row, col, element: e.target };
            selection.push(currentCell);
            e.target.classList.add('selecting'); // Highlight the starting cell
        }
    });

    // --- Mouse Over: Extend selection ---
    gridContainer.addEventListener('mouseover', (e) => {
        // Continue selection only if mouse button is down and over a grid cell
        if (isSelecting && e.target.classList.contains('grid-cell')) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const currentCell = { row, col, element: e.target };
            const lastCell = selection[selection.length - 1];

            // Avoid adding the exact same cell multiple times consecutively
            if (lastCell && lastCell.row === row && lastCell.col === col) {
                return;
            }

            // Check for backtracking (moving back over already selected cells)
            const cellIndex = selection.findIndex(cell => cell.row === row && cell.col === col);
            if (cellIndex !== -1 && cellIndex < selection.length - 1) {
                // User moved back, remove cells after the current one from selection
                const cellsToRemove = selection.splice(cellIndex + 1);
                cellsToRemove.forEach(cell => {
                     // Only remove 'selecting' if not already 'found'
                    if (!cell.element.classList.contains('found')) {
                         cell.element.classList.remove('selecting');
                    }
                });
                return; // Stop processing this mouseover event
            }

            // Add new cell if it's adjacent and follows the established direction (if any)
            if (cellIndex === -1) { // Only proceed if it's a new cell in the current path
                let isValidNextStep = false;
                if (selection.length === 1) {
                    // First move: must be adjacent
                    if (areCellsAdjacent(lastCell, currentCell)) {
                        isValidNextStep = true;
                    }
                } else if (selection.length > 1) {
                    // Subsequent moves: must maintain the direction established by the first two cells
                    const firstCell = selection[0];
                    const secondCell = selection[1];
                    const requiredRowStep = secondCell.row - firstCell.row;
                    const requiredColStep = secondCell.col - firstCell.col;
                    const currentRowStep = currentCell.row - lastCell.row;
                    const currentColStep = currentCell.col - lastCell.col;

                    // Check if movement matches the established direction and is adjacent
                    if (currentRowStep === requiredRowStep && currentColStep === requiredColStep && areCellsAdjacent(lastCell, currentCell)) {
                        isValidNextStep = true;
                    }
                }

                if (isValidNextStep) {
                    selection.push(currentCell);
                    e.target.classList.add('selecting'); // Highlight the newly added cell
                }
            }
        }
    });

    // --- Mouse Up: End selection (on the whole document) ---
    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            validateSelection(); // Check if the selection forms a valid word

            // Ensure any remaining '.selecting' styles are removed (if validation didn't mark them as 'found')
             // Use querySelectorAll on the gridContainer for safety.
            const stillSelecting = gridContainer.querySelectorAll('.grid-cell.selecting');
            stillSelecting.forEach(cellElement => {
                if (!cellElement.classList.contains('found')) {
                    cellElement.classList.remove('selecting');
                }
            });

            selection = []; // Clear the selection path array
        }
    });

    // Mark the grid container to indicate listeners have been attached
    gridContainer.setAttribute('data-listeners-added', 'true');
    console.log("DEBUG: Grid event listeners ADDED.");
}

// ==========================================================================
// Game Initialization Trigger
// ==========================================================================

/**
 * Initializes the entire game: resets state, builds grid, places words,
 * fills empty cells, displays UI, and sets up event listeners.
 */
function initGame() {
    console.log("--- Initializing New Game ---");
    resetGameState();      // Clear previous state and UI elements

    initializeGrid(gridSize);  // Create the empty grid data structure
    placeWords(wordsToFind);   // Attempt to place the target words
    fillEmptyCells();      // Fill remaining spots with random letters

    displayGrid();         // Render the grid in HTML
    displayWordList();     // Render the word list in HTML

    addGridListeners();    // Attach mouse listeners for interaction

    console.log("--- Game Ready ---");
}

// --- Start the game when the DOM is fully loaded ---
document.addEventListener('DOMContentLoaded', initGame);