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
        }
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
            messageElement.textContent = `Player ${currentPlayer} wins!`;
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
    
    // Event listeners
    resetButton.addEventListener('click', resetGame);
    newGameButton.addEventListener('click', newGame);
    
    // Initialize the game
    initGame();
});
