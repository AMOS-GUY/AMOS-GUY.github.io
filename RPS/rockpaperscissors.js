const CHOICES = ['rock', 'paper', 'scissors'];
const WIN_CONDITIONS = {
  rock : 'scissors',
  paper : 'rock',
  scissors : 'paper'
};

//DOM variables
const rockButton = document.querySelector('.rock-button');
const paperButton = document.querySelector('.paper-move');
const scissorsButton = document.querySelector('.scissors-button');
const playerMover = document.querySelector('.user-choice'), computerMover = document.querySelector('.computer-choice'), gameResults = document.querySelector('.game-result');


function computerChoice () {
  const randomMove = Math.floor(Math.random() * CHOICES.length);
  return CHOICES[randomMove];
}

function whoWon (playerMove, ComputerMove) {
  if(playerMove === ComputerMove){
    return 'Tie';
  }
  if(WIN_CONDITIONS[playerMove] === ComputerMove){
    return 'You Won';
  }
  return 'You Lost';
}

function displayResults (playerMove, ComputerMove, results){
  playerMover.textContent = `Your choice: ${playerMove}`;
  computerMover.textContent = `Computer's choice: ${ComputerMove}`;
  gameResults.textContent = `Result: ${results}`;

  gameResults.className = 'game-result';

  if(results.includes('win')) {
    gameResults.classList.add('win');
  } else if(results.includes('lose') || results.includes('Computer wins')) {
    gameResults.classList.add('lose');
  } else {
    gameResults.classList.add('tie');
  }
}

function playRound (playerMove) {
  const ComputerMove = computerChoice();
  const results = whoWon(playerMove, ComputerMove);
  displayResults(playerMove, ComputerMove, results);
}

function startTheGame () {
  rockButton.addEventListener('click', () => playRound('rock'));
  paperButton.addEventListener('click', () => playRound('paper'));
  scissorsButton.addEventListener('click', () => playRound('scissors'));
}

document.addEventListener('DOMContentLoaded', startTheGame);


