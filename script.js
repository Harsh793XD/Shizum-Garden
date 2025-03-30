// --- Global Variables and Constants ---
const defaultGridSize = 10;
let gridSize = defaultGridSize;
const wordsToFind = ['SERENE', 'CALM', 'GARDEN', 'STONE', 'WATER', 'BAMBOO', 'ZEN', 'PEACE'];
let grid = [];
let placedWordsInfo = [];
let foundWords = new Set();
let isSelecting = false;
let selection = [];
let foundWordCount = 0;

const directions = [
    { name: 'H', rowDelta: 0, colDelta: 1 }, { name: 'V', rowDelta: 1, colDelta: 0 },
    { name: 'D1', rowDelta: 1, colDelta: 1 }, { name: 'D2', rowDelta: 1, colDelta: -1 }
];

const wordSounds = {
    SERENE: 'sounds/serene.mp3', CALM: 'sounds/calm.mp3', GARDEN: 'sounds/garden.mp3',
    STONE: 'sounds/stone.mp3', WATER: 'sounds/water.mp3', BAMBOO: 'sounds/bamboo.mp3',
    ZEN: 'sounds/zen.mp3', PEACE: 'sounds/peace.mp3', DEFAULT: 'sounds/peacock.mp3'
};

// --- DOM Element References ---
const gridContainer = document.getElementById('grid-container');
const wordListElement = document.getElementById('word-list');
const gardenVisualizationElement = document.getElementById('garden-visualization');
const mindfulnessPopupElement = document.getElementById('mindfulness-popup');

// ==========================================================================
// Game Setup and Initialization (Functions: resetGameState, initializeGrid,
// canPlaceWord, placeWordInGrid, placeWords, fillEmptyCells)
// ... NO CHANGES IN THESE FUNCTIONS ...
// ==========================================================================

function resetGameState() {
    console.log("DEBUG: Resetting game state");
    grid = []; placedWordsInfo = []; foundWords = new Set();
    isSelecting = false; selection = []; foundWordCount = 0;
    if (gridContainer) { gridContainer.innerHTML = ''; gridContainer.removeAttribute('data-listeners-added'); }
    if (wordListElement) wordListElement.innerHTML = '';
    // Reset garden visualization - removing classes makes it revert to base style (Stage 0)
    if (gardenVisualizationElement) gardenVisualizationElement.className = '';
    if (mindfulnessPopupElement) {
        mindfulnessPopupElement.classList.remove('show', 'win-message');
        if (mindfulnessPopupElement.hideTimeout) { clearTimeout(mindfulnessPopupElement.hideTimeout); mindfulnessPopupElement.hideTimeout = null; }
    }
}

function initializeGrid(size) { /* ...no changes... */ grid = Array(size).fill(null).map(() => Array(size).fill(null)); }
function canPlaceWord(word, row, col, direction) { /* ...no changes... */ const len = word.length; for (let i = 0; i < len; i++) { const r = row + i * direction.rowDelta, c = col + i * direction.colDelta; if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false; const cell = grid[r][c]; if (cell !== null && cell !== word[i]) return false; } return true; }
function placeWordInGrid(word, row, col, direction) { /* ...no changes... */ const len = word.length; const cells = []; for (let i = 0; i < len; i++) { const r = row + i * direction.rowDelta, c = col + i * direction.colDelta; grid[r][c] = word[i]; cells.push({ row: r, col: c }); } placedWordsInfo.push({ word, cells, startRow: row, startCol: col, direction: direction.name }); }
function placeWords(words) { /* ...no changes... */ const maxAttempts = 50; let placed = 0; words.forEach(w => { let p = false; for (let a = 0; a < maxAttempts && !p; a++) { const dir = directions[Math.floor(Math.random() * directions.length)]; const len = w.length; const rd = dir.rowDelta, cd = dir.colDelta; let minR = 0, maxR = gridSize - 1, minC = 0, maxC = gridSize - 1; if (rd > 0) maxR = gridSize - len; if (cd > 0) maxC = gridSize - len; if (cd < 0) minC = len - 1; if (maxR < minR || maxC < minC) continue; const r = minR + Math.floor(Math.random() * (maxR - minR + 1)); const c = minC + Math.floor(Math.random() * (maxC - minC + 1)); if (canPlaceWord(w, r, c, dir)) { placeWordInGrid(w, r, c, dir); p = true; placed++; } } }); if (placed < words.length) console.warn(`Placed ${placed}/${words.length} words.`); }
function fillEmptyCells() { /* ...no changes... */ const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) if (grid[r][c] === null) grid[r][c] = alpha[Math.floor(Math.random() * alpha.length)]; }


// ==========================================================================
// UI Display Functions (Functions: displayGrid, displayWordList)
// ... NO CHANGES IN THESE FUNCTIONS ...
// ==========================================================================

function displayGrid() { /* ...no changes... */ if (!gridContainer) return; gridContainer.innerHTML = ''; gridContainer.style.setProperty('--grid-size', gridSize); for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) { const cell = document.createElement('div'); cell.className = 'grid-cell'; cell.dataset.row = r; cell.dataset.col = c; cell.textContent = grid[r][c]; gridContainer.appendChild(cell); } }
function displayWordList() { /* ...no changes... */ if (!wordListElement) return; wordListElement.innerHTML = ''; wordsToFind.forEach(w => { const li = document.createElement('li'); li.textContent = w; li.id = `word-item-${w}`; if (foundWords.has(w)) li.classList.add('found-word'); wordListElement.appendChild(li); }); }


// ==========================================================================
// Game Logic and Interaction (Functions: areCellsAdjacent, playAudio,
// triggerGardenGrowth, getMindfulnessPrompt, showMindfulnessMoment,
// checkWinCondition, displayWinMessage, validateSelection)
// ... triggerGardenGrowth IS MODIFIED ...
// ==========================================================================

function areCellsAdjacent(cell1, cell2) { /* ...no changes... */ if (!cell1 || !cell2) return false; const rDiff = Math.abs(cell1.row - cell2.row), cDiff = Math.abs(cell1.col - cell2.col); return rDiff <= 1 && cDiff <= 1 && !(rDiff === 0 && cDiff === 0); }
function playAudio(soundPath) { /* ...no changes... */ if (!soundPath) { console.warn("No sound path."); return; } try { const audio = new Audio(soundPath); audio.currentTime = 0; audio.play().catch(err => { if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') console.error(`Audio play failed: ${soundPath}`, err); else if (err.name === 'NotAllowedError') console.warn(`Audio (${soundPath}) prevented: User interaction needed.`); }); } catch (error) { console.error(`Audio error: ${soundPath}`, error); } }

/**
 * Updates the garden visualization based on the number of words found (5 stages).
 * Stage 0: 0-1 words
 * Stage 1: 2-3 words
 * Stage 2: 4-5 words
 * Stage 3: 6-7 words
 * Stage 4: 8 words (all)
 */
function triggerGardenGrowth() {
    if (!gardenVisualizationElement) {
        console.error("DEBUG: gardenVisualizationElement not found!");
        return;
    }

    console.log(`DEBUG: triggerGardenGrowth. Found count: ${foundWordCount}`);

    let stageClassToAdd = null;

    // Determine which stage class to apply based on foundWordCount
    if (foundWordCount >= 8) { // Stage 4 (All words found)
        stageClassToAdd = 'growth-stage-4';
    } else if (foundWordCount >= 6) { // Stage 3
        stageClassToAdd = 'growth-stage-3';
    } else if (foundWordCount >= 4) { // Stage 2
        stageClassToAdd = 'growth-stage-2';
    } else if (foundWordCount >= 2) { // Stage 1
        stageClassToAdd = 'growth-stage-1';
    }
    // Else: Stage 0 (0 or 1 word found) - No class needed, uses base style.

    // --- Manage Classes ---
    // 1. Remove ALL possible stage classes first
    gardenVisualizationElement.classList.remove(
        'growth-stage-1',
        'growth-stage-2',
        'growth-stage-3',
        'growth-stage-4'
    );

    // 2. Add the determined stage class (if any)
    if (stageClassToAdd) {
        gardenVisualizationElement.classList.add(stageClassToAdd);
        console.log(`DEBUG: Applying garden growth class: ${stageClassToAdd}`);
    } else {
        console.log("DEBUG: Applying base garden style (Stage 0).");
    }
     console.log('DEBUG: Final garden classes:', gardenVisualizationElement.className);
}


function getMindfulnessPrompt(word) { /* ...no changes... */ const prompts = { SERENE: 'Embrace the serenity...', CALM: 'Find a moment of calm...', GARDEN: 'Picture a peaceful garden...', STONE: 'Feel the strength...', WATER: 'Imagine flowing water...', BAMBOO: 'Be flexible like bamboo...', ZEN: 'Seek Zen...', PEACE: 'Reflect on peace...' }; return prompts[word] || `Reflect on "${word}"...`; }
function showMindfulnessMoment(word) { /* ...no changes... */ if (!mindfulnessPopupElement) return; console.log(`DEBUG: showMindfulnessMoment: ${word}`); const prompt = getMindfulnessPrompt(word); mindfulnessPopupElement.innerHTML = `<p>${prompt}</p>`; mindfulnessPopupElement.classList.remove('win-message'); if (mindfulnessPopupElement.hideTimeout) clearTimeout(mindfulnessPopupElement.hideTimeout); mindfulnessPopupElement.classList.add('show'); mindfulnessPopupElement.hideTimeout = setTimeout(() => { mindfulnessPopupElement.classList.remove('show'); mindfulnessPopupElement.hideTimeout = null; }, 5000); }
function checkWinCondition() { /* ...no changes... */ const allFound = foundWords.size === wordsToFind.length; console.log(`DEBUG: checkWinCondition: ${foundWords.size}/${wordsToFind.length}, Result=${allFound}`); return allFound; }
function displayWinMessage() { /* ...no changes... */ if (!mindfulnessPopupElement) return; console.log("DEBUG: displayWinMessage CALLED."); if (mindfulnessPopupElement.hideTimeout) { clearTimeout(mindfulnessPopupElement.hideTimeout); mindfulnessPopupElement.hideTimeout = null; } mindfulnessPopupElement.innerHTML = `<div class="win-message"><h3>Harmony Found.</h3><p>Congratulations!</p><button id="new-puzzle-btn">New Puzzle?</button></div>`; mindfulnessPopupElement.classList.remove('show'); mindfulnessPopupElement.classList.add('show', 'win-message'); const btn = document.getElementById('new-puzzle-btn'); if (btn) { btn.onclick = null; btn.onclick = initGame; } else console.error("New puzzle button not found!"); }

function validateSelection() {
     // --- This function remains the same as the previous version ---
     // It correctly calls playAudio, triggerGardenGrowth, showMindfulnessMoment, and checkWinCondition
     // The logic inside triggerGardenGrowth handles the new stages.

    if (selection.length < 2) {
        selection.forEach(cell => { if (cell?.element && !cell.element.classList.contains('found')) cell.element.classList.remove('selecting'); });
        selection = []; // Clear selection if too short
        return;
    }
    const selectedWord = selection.map(cell => cell.element.textContent).join('');
    const reverseSelectedWord = selectedWord.split('').reverse().join('');
    let wordFound = null;
    console.log(`DEBUG: Validating: "${selectedWord}" / "${reverseSelectedWord}"`);
    if (wordsToFind.includes(selectedWord) && !foundWords.has(selectedWord)) wordFound = selectedWord;
    else if (wordsToFind.includes(reverseSelectedWord) && !foundWords.has(reverseSelectedWord)) wordFound = reverseSelectedWord;

    if (wordFound) {
        console.log(`DEBUG: Word found: ${wordFound}`);
        foundWordCount++; // Increment count *before* triggering growth
        foundWords.add(wordFound);
        const wordListItem = document.getElementById(`word-item-${wordFound}`);
        if (wordListItem) wordListItem.classList.add('found-word');
        selection.forEach(cell => { cell.element.classList.add('found'); cell.element.classList.remove('selecting'); });

        const soundPath = wordSounds[wordFound] || wordSounds.DEFAULT;
        if (soundPath) playAudio(soundPath);
        else console.warn(`No sound for ${wordFound} or default.`);

        triggerGardenGrowth(); // Call the updated growth function
        showMindfulnessMoment(wordFound);

        if (checkWinCondition()) {
            setTimeout(displayWinMessage, 700);
        }
    } else {
        console.log(`DEBUG: Invalid/already found: "${selectedWord}"`);
        selection.forEach(cell => { if (cell?.element && !cell.element.classList.contains('found')) cell.element.classList.remove('selecting'); });
    }
     selection = []; // Clear selection regardless of outcome
}


// ==========================================================================
// Event Listener Setup (Mouse and Touch - Functions: addGridListeners
// includes helpers handleSelectionStart, handleSelectionMove, handleSelectionEnd)
// ... NO CHANGES IN THESE FUNCTIONS ...
// ==========================================================================
function addGridListeners() {
     // --- This function remains the same as the previous version ---
     // It handles both mouse and touch input correctly.

    if (!gridContainer || gridContainer.hasAttribute('data-listeners-added')) return;
    function handleStart(target) { if (target?.classList.contains('grid-cell')) { isSelecting = true; selection = []; const r = parseInt(target.dataset.row), c = parseInt(target.dataset.col); const cell = { row: r, col: c, element: target }; selection.push(cell); if (!cell.element.classList.contains('found')) cell.element.classList.add('selecting'); } }
    function handleMove(target) { if (!isSelecting || !target?.classList.contains('grid-cell')) return; const r = parseInt(target.dataset.row), c = parseInt(target.dataset.col); const current = { row: r, col: c, element: target }; const last = selection.length > 0 ? selection[selection.length - 1] : null; if (last && last.row === r && last.col === c) return; const idx = selection.findIndex(cell => cell.row === r && cell.col === c); if (idx !== -1 && idx < selection.length - 1) { const removed = selection.splice(idx + 1); removed.forEach(cell => { if (!cell.element.classList.contains('found')) cell.element.classList.remove('selecting'); }); return; } if (idx === -1) { let valid = false; if (!last) valid = false; else if (selection.length === 1) { if (areCellsAdjacent(last, current)) valid = true; } else { const first = selection[0], second = selection[1]; const reqRStep = second.row - first.row, reqCStep = second.col - first.col; const curRStep = current.row - last.row, curCStep = current.col - last.col; if (curRStep === reqRStep && curCStep === reqCStep && areCellsAdjacent(last, current)) valid = true; } if (valid) { selection.push(current); if (!current.element.classList.contains('found')) current.element.classList.add('selecting'); } } }
    function handleEnd() { if (isSelecting) { validateSelection(); isSelecting = false; /* validateSelection now clears selection array */ } } /* Removed redundant cleanup here */

    gridContainer.addEventListener('mousedown', e => { e.preventDefault(); handleStart(e.target); });
    gridContainer.addEventListener('mouseover', e => { handleMove(e.target); });
    document.addEventListener('mouseup', e => { handleEnd(); });
    gridContainer.addEventListener('touchstart', e => { e.preventDefault(); if (e.touches.length > 0) { const t = e.touches[0]; handleStart(document.elementFromPoint(t.clientX, t.clientY)); } }, { passive: false });
    gridContainer.addEventListener('touchmove', e => { e.preventDefault(); if (e.touches.length > 0) { const t = e.touches[0]; handleMove(document.elementFromPoint(t.clientX, t.clientY)); } }, { passive: false });
    document.addEventListener('touchend', e => { handleEnd(); });
    document.addEventListener('touchcancel', e => { handleEnd(); });
    gridContainer.setAttribute('data-listeners-added', 'true');
    console.log("DEBUG: Mouse/Touch listeners ADDED.");
}

// ==========================================================================
// Game Initialization Trigger (Function: initGame)
// ... NO CHANGES IN THIS FUNCTION ...
// ==========================================================================

function initGame() {
    console.log("--- Initializing New Game ---");
    resetGameState();
    initializeGrid(gridSize);
    placeWords(wordsToFind);
    fillEmptyCells();
    displayGrid();
    displayWordList();
    addGridListeners(); // This adds both mouse and touch
    triggerGardenGrowth(); // Call once at start to ensure stage 0 visuals apply
    console.log("--- Game Ready ---");
}

// --- Start the game ---
document.addEventListener('DOMContentLoaded', initGame);