document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let scores = {
        X: 0,
        O: 0,
        draw: 0
    };
    let gameMode = 'pvp'; // 'pvp' or 'pvc'
    let playerNames = {
        X: 'Player X',
        O: 'Player O'
    };
    
    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const messageElement = document.querySelector('.message');
    const playerXElement = document.querySelector('.player-x');
    const playerOElement = document.querySelector('.player-o');
    const resetButton = document.getElementById('reset');
    const newGameButton = document.getElementById('new-game');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const scoreDrawElement = document.getElementById('score-draw');
    const modePvPButton = document.getElementById('mode-pvp');
    const modePvCButton = document.getElementById('mode-pvc');
    const playerXNameInput = document.getElementById('player-x-name');
    const playerONameInput = document.getElementById('player-o-name');
    const saveNamesButton = document.getElementById('save-names');
    
    // Winning combinations
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Initialize the game
    function initGame() {
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'win');
            cell.addEventListener('click', handleCellClick);
        });
        
        updatePlayerIndicator();
        messageElement.textContent = '';
        messageElement.className = 'message';
        gameActive = true;
        gameBoard = ['', '', '', '', '', '', '', '', ''];
    }
    
    // Handle cell click
    function handleCellClick(event) {
        const clickedCell = event.target;
        const cellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        // Check if cell is already occupied or game is not active
        if (gameBoard[cellIndex] !== '' || !gameActive) {
            return;
        }
        
        // Update game board and UI
        gameBoard[cellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());
        
        // Check for win or draw
        if (checkWin()) {
            endGame(false);
        } else if (isDraw()) {
            endGame(true);
        } else {
            // Switch player
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updatePlayerIndicator();
            
            // If playing against computer and it's computer's turn
            if (gameMode === 'pvc' && currentPlayer === 'O' && gameActive) {
                setTimeout(computerMove, 500); // Add slight delay for better UX
            }
        }
    }
    
    // Computer's move
    function computerMove() {
        if (!gameActive) return;
        
        // Simple AI strategy:
        // 1. Try to win if possible
        // 2. Block player's winning move
        // 3. Take center if available
        // 4. Take a corner if available
        // 5. Take any available space
        
        let move = findWinningMove('O') || // Try to win
                  findWinningMove('X') || // Block player
                  takeCenter() || // Take center
                  takeCorner() || // Take a corner
                  takeAnyAvailable(); // Take any available space
        
        if (move !== null) {
            // Make the move
            gameBoard[move] = 'O';
            cells[move].textContent = 'O';
            cells[move].classList.add('o');
            
            // Check for win or draw
            if (checkWin()) {
                endGame(false);
            } else if (isDraw()) {
                endGame(true);
            } else {
                // Switch back to player
                currentPlayer = 'X';
                updatePlayerIndicator();
            }
        }
    }
    
    // Find a winning move for the specified player
    function findWinningMove(player) {
        for (let condition of winningConditions) {
            const [a, b, c] = condition;
            // Check if two cells are occupied by the player and the third is empty
            if (gameBoard[a] === player && gameBoard[b] === player && gameBoard[c] === '') {
                return c;
            }
            if (gameBoard[a] === player && gameBoard[c] === player && gameBoard[b] === '') {
                return b;
            }
            if (gameBoard[b] === player && gameBoard[c] === player && gameBoard[a] === '') {
                return a;
            }
        }
        return null;
    }
    
    // Take center if available
    function takeCenter() {
        return gameBoard[4] === '' ? 4 : null;
    }
    
    // Take a corner if available
    function takeCorner() {
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => gameBoard[index] === '');
        return availableCorners.length > 0 ? 
               availableCorners[Math.floor(Math.random() * availableCorners.length)] : 
               null;
    }
    
    // Take any available space
    function takeAnyAvailable() {
        const availableSpaces = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        
        return availableSpaces.length > 0 ? 
               availableSpaces[Math.floor(Math.random() * availableSpaces.length)] : 
               null;
    }
    
    // Check for win
    function checkWin() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
                // Highlight winning cells
                cells[a].classList.add('win');
                cells[b].classList.add('win');
                cells[c].classList.add('win');
                return true;
            }
        }
        return false;
    }
    
    // Check for draw
    function isDraw() {
        return !gameBoard.includes('');
    }
    
    // End the game
    function endGame(isDraw) {
        gameActive = false;
        
        if (isDraw) {
            messageElement.textContent = "Game ended in a draw!";
            messageElement.classList.add('draw');
            scores.draw++;
            scoreDrawElement.textContent = scores.draw;
        } else {
            const winnerName = gameMode === 'pvc' && currentPlayer === 'O' 
                ? 'Computer' 
                : playerNames[currentPlayer];
            
            messageElement.textContent = `${winnerName} wins!`;
            messageElement.classList.add('win');
            scores[currentPlayer]++;
            if (currentPlayer === 'X') {
                scoreXElement.textContent = scores.X;
            } else {
                scoreOElement.textContent = scores.O;
            }
        }
    }
    
    // Update player indicator
    function updatePlayerIndicator() {
        if (currentPlayer === 'X') {
            playerXElement.classList.add('active');
            playerOElement.classList.remove('active');
        } else {
            playerOElement.classList.add('active');
            playerXElement.classList.remove('active');
        }
        
        // Update player labels based on game mode
        if (gameMode === 'pvc') {
            playerXElement.textContent = playerNames.X;
            playerOElement.textContent = 'Computer';
        } else {
            playerXElement.textContent = playerNames.X;
            playerOElement.textContent = playerNames.O;
        }
    }
    
    // Reset the current game
    function resetGame() {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        initGame();
    }
    
    // Start a new game (reset scores)
    function newGame() {
        scores = { X: 0, O: 0, draw: 0 };
        scoreXElement.textContent = '0';
        scoreOElement.textContent = '0';
        scoreDrawElement.textContent = '0';
        resetGame();
    }
    
    // Set game mode
    function setGameMode(mode) {
        gameMode = mode;
        
        // Update UI
        modePvPButton.classList.toggle('active', mode === 'pvp');
        modePvCButton.classList.toggle('active', mode === 'pvc');
        
        // Update player O name if switching to computer mode
        if (mode === 'pvc') {
            playerNames.O = 'Computer';
            playerONameInput.value = 'Computer';
            playerONameInput.disabled = true;
        } else {
            playerONameInput.disabled = false;
            if (playerONameInput.value === 'Computer') {
                playerONameInput.value = '';
            }
        }
        
        // Reset game with new mode
        resetGame();
    }
    
    // Save player names
    function savePlayerNames() {
        const playerXName = playerXNameInput.value.trim() || 'Player X';
        const playerOName = playerONameInput.value.trim() || 'Player O';
        
        playerNames.X = playerXName;
        playerNames.O = gameMode === 'pvc' ? 'Computer' : playerOName;
        
        updatePlayerIndicator();
        
        // Show confirmation
        const originalText = saveNamesButton.textContent;
        saveNamesButton.textContent = 'Names Saved!';
        saveNamesButton.style.backgroundColor = '#2ecc71';
        
        setTimeout(() => {
            saveNamesButton.textContent = originalText;
            saveNamesButton.style.backgroundColor = '';
        }, 1500);
    }
    
    // Event listeners
    resetButton.addEventListener('click', resetGame);
    newGameButton.addEventListener('click', newGame);
    modePvPButton.addEventListener('click', () => setGameMode('pvp'));
    modePvCButton.addEventListener('click', () => setGameMode('pvc'));
    saveNamesButton.addEventListener('click', savePlayerNames);
    
    // Initialize the game
    initGame();
});