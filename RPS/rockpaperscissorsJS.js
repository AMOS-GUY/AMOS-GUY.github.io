// Game constants
const CHOICES = ['rock', 'paper', 'scissors'];
const WIN_CONDITIONS = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

// DOM elements
const rockButton = document.querySelector('.rock-button');
const paperButton = document.querySelector('.paper-button');
const scissorsButton = document.querySelector('.scissors-button');
const userChoiceDisplay = document.querySelector('.user-choice');
const computerChoiceDisplay = document.querySelector('.computer-choice');
const gameResultDisplay = document.querySelector('.game-result');

// Computer's random choice
function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * CHOICES.length);
    return CHOICES[randomIndex];
}

// Determine winner
function determineWinner(userChoice, computerChoice) {
    if (userChoice === computerChoice) {
        return "It's a tie!";
    }
    
    if (WIN_CONDITIONS[userChoice] === computerChoice) {
        return "You win!";
    }
    
    return "Computer wins!";
}

// Update display
function updateDisplay(userChoice, computerChoice, result) {
    userChoiceDisplay.textContent = `Your choice: ${userChoice}`;
    computerChoiceDisplay.textContent = `Computer's choice: ${computerChoice}`;
    gameResultDisplay.textContent = `Result: ${result}`;
    
    // Add visual feedback for result
    gameResultDisplay.className = 'game-result'; // Reset classes
    
    if (result.includes('win')) {
        gameResultDisplay.classList.add('win');
    } else if (result.includes('lose') || result.includes('Computer wins')) {
        gameResultDisplay.classList.add('lose');
    } else {
        gameResultDisplay.classList.add('tie');
    }
}

// Play round
function playRound(userChoice) {
    const computerChoice = getComputerChoice();
    const result = determineWinner(userChoice, computerChoice);
    updateDisplay(userChoice, computerChoice, result);
}

// Add event listeners to buttons
function initializeGame() {
    rockButton.addEventListener('click', () => playRound('rock'));
    paperButton.addEventListener('click', () => playRound('paper'));
    scissorsButton.addEventListener('click', () => playRound('scissors'));
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);