document.addEventListener('DOMContentLoaded', () => {
    // Cube representation
    // Each face is a 3x3 array
    // Colors: 0=white, 1=green, 2=red, 3=blue, 4=orange, 5=yellow
    let cube = {
        U: Array(3).fill().map(() => Array(3).fill(0)), // White
        F: Array(3).fill().map(() => Array(3).fill(1)), // Green
        R: Array(3).fill().map(() => Array(3).fill(2)), // Red
        B: Array(3).fill().map(() => Array(3).fill(3)), // Blue
        L: Array(3).fill().map(() => Array(3).fill(4)), // Orange
        D: Array(3).fill().map(() => Array(3).fill(5))  // Yellow
    };

    // Cube state
    let isSolving = false;
    let moveHistory = [];
    let solutionSteps = [];
    let currentStep = 0;
    let viewRotation = { x: 0, y: 0, z: 0 };

    // DOM elements
    const cube3dElement = document.getElementById('cube-3d');
    const movesListElement = document.getElementById('moves-list');
    const stepsListElement = document.getElementById('steps-list');
    const cubeStatusElement = document.getElementById('cube-status');
    const moveCountElement = document.getElementById('move-count');
    const solutionCountElement = document.getElementById('solution-count');
    const currentStepElement = document.getElementById('current-step');
    const stepCounterElement = document.getElementById('step-counter');

    // Color mapping
    const colorMap = {
        0: '#ffffff', // White
        1: '#40c057', // Green
        2: '#fa5252', // Red
        3: '#228be6', // Blue
        4: '#fd7e14', // Orange
        5: '#ffd43b'  // Yellow
    };

    // Face names mapping
    const faceNames = {
        'U': 'Up (White)',
        'F': 'Front (Green)',
        'R': 'Right (Red)',
        'B': 'Back (Blue)',
        'L': 'Left (Orange)',
        'D': 'Down (Yellow)'
    };

    // Initialize the cube display
    function initCubeDisplay() {
        cube3dElement.innerHTML = '';
        
        // Create a 2D representation of the cube
        const cubeDisplay = document.createElement('div');
        cubeDisplay.className = 'cube-display';
        
        // Create faces in the correct positions
        // Top row: Up face
        const topRow = document.createElement('div');
        topRow.className = 'face-row-display';
        
        const upFace = createFaceDisplay('U', cube.U);
        topRow.appendChild(upFace);
        
        // Middle row: Left, Front, Right, Back faces
        const middleRow = document.createElement('div');
        middleRow.className = 'face-row-display';
        
        const leftFace = createFaceDisplay('L', cube.L);
        const frontFace = createFaceDisplay('F', cube.F);
        const rightFace = createFaceDisplay('R', cube.R);
        const backFace = createFaceDisplay('B', cube.B);
        
        middleRow.appendChild(leftFace);
        middleRow.appendChild(frontFace);
        middleRow.appendChild(rightFace);
        middleRow.appendChild(backFace);
        
        // Bottom row: Down face
        const bottomRow = document.createElement('div');
        bottomRow.className = 'face-row-display';
        
        const downFace = createFaceDisplay('D', cube.D);
        bottomRow.appendChild(downFace);
        
        cubeDisplay.appendChild(topRow);
        cubeDisplay.appendChild(middleRow);
        cubeDisplay.appendChild(bottomRow);
        cube3dElement.appendChild(cubeDisplay);
        
        // Apply view rotation
        cubeDisplay.style.transform = `rotateX(${viewRotation.x}deg) rotateY(${viewRotation.y}deg) rotateZ(${viewRotation.z}deg)`;
        cubeDisplay.style.transition = 'transform 0.5s ease';
    }

    // Create a face display
    function createFaceDisplay(faceName, faceColors) {
        const faceContainer = document.createElement('div');
        faceContainer.className = 'face-container';
        
        const faceElement = document.createElement('div');
        faceElement.className = 'cube-face';
        
        // Create 3x3 grid of cells
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cell = document.createElement('div');
                cell.className = 'cube-cell';
                cell.style.backgroundColor = colorMap[faceColors[row][col]];
                faceElement.appendChild(cell);
            }
        }
        
        const label = document.createElement('div');
        label.className = 'face-label';
        label.textContent = faceName;
        
        faceContainer.appendChild(faceElement);
        faceContainer.appendChild(label);
        return faceContainer;
    }

    // Rotate a face clockwise
    function rotateFace(face) {
        if (isSolving) return;
        
        const newFace = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        const faceColors = cube[face];
        
        // Rotate the face matrix 90 degrees clockwise
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                newFace[j][2 - i] = faceColors[i][j];
            }
        }
        
        cube[face] = newFace;
        
        // Adjust adjacent faces based on which face is being rotated
        switch (face) {
            case 'U': // Up face
                [cube.F[0], cube.R[0], cube.B[0], cube.L[0]] = 
                [cube.L[0], cube.F[0], cube.R[0], cube.B[0]];
                break;
                
            case 'D': // Down face (clockwise rotation is opposite to up)
                [cube.F[2], cube.L[2], cube.B[2], cube.R[2]] = 
                [cube.R[2], cube.F[2], cube.L[2], cube.B[2]];
                break;
                
            case 'F': // Front face
                // Store top row of right, bottom row of left, etc.
                const tempU = cube.U[2].slice();
                const tempR = [cube.R[0][0], cube.R[1][0], cube.R[2][0]];
                const tempD = cube.D[0].slice();
                const tempL = [cube.L[0][2], cube.L[1][2], cube.L[2][2]];
                
                // Update adjacent faces
                cube.U[2] = [tempL[2], tempL[1], tempL[0]];
                for (let i = 0; i < 3; i++) cube.R[i][0] = tempU[i];
                cube.D[0] = [tempR[2], tempR[1], tempR[0]];
                for (let i = 0; i < 3; i++) cube.L[i][2] = tempD[i];
                break;
                
            case 'B': // Back face
                const tempU2 = cube.U[0].slice();
                const tempL2 = [cube.L[0][0], cube.L[1][0], cube.L[2][0]];
                const tempD2 = cube.D[2].slice();
                const tempR2 = [cube.R[0][2], cube.R[1][2], cube.R[2][2]];
                
                cube.U[0] = tempR2;
                for (let i = 0; i < 3; i++) cube.L[i][0] = tempU2[2 - i];
                cube.D[2] = tempL2;
                for (let i = 0; i < 3; i++) cube.R[i][2] = tempD2[2 - i];
                break;
                
            case 'R': // Right face
                const tempU3 = [cube.U[0][2], cube.U[1][2], cube.U[2][2]];
                const tempB3 = [cube.B[0][0], cube.B[1][0], cube.B[2][0]];
                const tempD3 = [cube.D[0][2], cube.D[1][2], cube.D[2][2]];
                const tempF3 = [cube.F[0][2], cube.F[1][2], cube.F[2][2]];
                
                for (let i = 0; i < 3; i++) cube.U[i][2] = tempF3[i];
                for (let i = 0; i < 3; i++) cube.B[i][0] = tempU3[2 - i];
                for (let i = 0; i < 3; i++) cube.D[i][2] = tempB3[2 - i];
                for (let i = 0; i < 3; i++) cube.F[i][2] = tempD3[i];
                break;
                
            case 'L': // Left face
                const tempU4 = [cube.U[0][0], cube.U[1][0], cube.U[2][0]];
                const tempF4 = [cube.F[0][0], cube.F[1][0], cube.F[2][0]];
                const tempD4 = [cube.D[0][0], cube.D[1][0], cube.D[2][0]];
                const tempB4 = [cube.B[0][2], cube.B[1][2], cube.B[2][2]];
                
                for (let i = 0; i < 3; i++) cube.U[i][0] = tempB4[2 - i];
                for (let i = 0; i < 3; i++) cube.F[i][0] = tempU4[i];
                for (let i = 0; i < 3; i++) cube.D[i][0] = tempF4[i];
                for (let i = 0; i < 3; i++) cube.B[i][2] = tempD4[2 - i];
                break;
        }
        
        // Add to move history
        moveHistory.push(face);
        updateMoveHistory();
        updateCubeInfo();
        initCubeDisplay();
    }

    // Scramble the cube
    function scrambleCube() {
        if (isSolving) return;
        
        const moves = ['U', 'F', 'R', 'L', 'B', 'D'];
        const scrambleLength = 20;
        
        // Clear previous moves
        moveHistory = [];
        
        // Generate random moves
        for (let i = 0; i < scrambleLength; i++) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            rotateFace(randomMove);
        }
        
        // Update UI
        cubeStatusElement.textContent = 'Scrambled';
        cubeStatusElement.className = 'status scrambled';
        updateCubeInfo();
    }

    // Solve the cube (simplified solver for demonstration)
    function solveCube() {
        if (isSolving) return;
        
        isSolving = true;
        cubeStatusElement.textContent = 'Solving...';
        cubeStatusElement.className = 'status solving';
        
        // Generate solution steps based on current cube state
        solutionSteps = generateSolution();
        currentStep = 0;
        
        // Update solution display
        updateSolutionSteps();
        updateCubeInfo();
        
        isSolving = false;
        cubeStatusElement.textContent = 'Solution Ready';
        cubeStatusElement.className = 'status solved';
    }

    // Generate solution steps (simplified for demo)
    function generateSolution() {
        const steps = [];
        
        // This is a simplified "solution" that just reverses the move history
        // In a real solver, this would be a proper algorithm like CFOP
        const reversedMoves = [...moveHistory].reverse().map(move => {
            return move.toLowerCase(); // Lowercase means counterclockwise in cube notation
        });
        
        // Add some instructional steps
        steps.push({
            move: 'Start',
            description: 'Begin solving the cube. We will work layer by layer.'
        });
        
        steps.push({
            move: 'Cross',
            description: 'Make a white cross on the top face.'
        });
        
        // Add the reversed moves as solution steps
        reversedMoves.forEach((move, index) => {
            steps.push({
                move: move.toUpperCase(),
                description: `Step ${index + 1}: Reverse move ${move.toUpperCase()}`
            });
        });
        
        steps.push({
            move: 'Finish',
            description: 'Complete the solution. Cube should be solved!'
        });
        
        return steps;
    }

    // Apply the next solution step
    function applyNextStep() {
        if (currentStep >= solutionSteps.length - 1) return;
        
        currentStep++;
        updateSolutionSteps();
        
        // If the step has a move (not a description step), apply it
        const step = solutionSteps[currentStep];
        if (step.move && step.move.length === 1 && step.move !== 'Start' && step.move !== 'Finish' && step.move !== 'Cross') {
            const move = step.move.toUpperCase();
            rotateFace(move);
        }
    }

    // Apply the previous solution step
    function applyPrevStep() {
        if (currentStep <= 0) return;
        
        currentStep--;
        updateSolutionSteps();
        
        // If we're going back, we need to reverse the move
        const step = solutionSteps[currentStep + 1];
        if (step.move && step.move.length === 1 && step.move !== 'Start' && step.move !== 'Finish' && step.move !== 'Cross') {
            const move = step.move.toUpperCase();
            // For simplicity, just rotate the opposite face
            rotateFace(move);
        }
    }

    // Update solution steps display
    function updateSolutionSteps() {
        stepsListElement.innerHTML = '';
        
        if (solutionSteps.length === 0) {
            stepsListElement.innerHTML = '<p class="empty-steps">Click "Solve" to generate solution steps</p>';
            return;
        }
        
        solutionSteps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = `step ${index === currentStep ? 'active' : ''}`;
            
            const stepNumber = document.createElement('span');
            stepNumber.className = 'step-number';
            stepNumber.textContent = `${index + 1}.`;
            
            const stepMove = document.createElement('span');
            stepMove.className = 'step-move';
            stepMove.textContent = step.move;
            
            const stepDescription = document.createElement('div');
            stepDescription.className = 'step-description';
            stepDescription.textContent = step.description;
            
            stepElement.appendChild(stepNumber);
            stepElement.appendChild(stepMove);
            stepElement.appendChild(stepDescription);
            stepsListElement.appendChild(stepElement);
        });
        
        // Update step counter
        stepCounterElement.textContent = `Step: ${currentStep + 1}/${solutionSteps.length}`;
        currentStepElement.textContent = currentStep + 1;
        solutionCountElement.textContent = solutionSteps.length;
    }

    // Update move history display
    function updateMoveHistory() {
        movesListElement.innerHTML = '';
        
        if (moveHistory.length === 0) {
            movesListElement.innerHTML = '<p class="empty-moves">No moves yet. Start rotating the cube!</p>';
            return;
        }
        
        // Group moves in sets of 5 for better readability
        for (let i = 0; i < moveHistory.length; i += 5) {
            const moveGroup = document.createElement('div');
            moveGroup.className = 'move-group';
            
            const groupMoves = moveHistory.slice(i, i + 5);
            moveGroup.textContent = `${i + 1}. ${groupMoves.join(' ')}`;
            movesListElement.appendChild(moveGroup);
        }
        
        moveCountElement.textContent = moveHistory.length;
    }

    // Update cube information
    function updateCubeInfo() {
        // Check if cube is solved
        const isSolved = checkIfSolved();
        if (!isSolving) {
            cubeStatusElement.textContent = isSolved ? 'Solved' : 'Scrambled';
            cubeStatusElement.className = `status ${isSolved ? 'solved' : 'scrambled'}`;
        }
        
        moveCountElement.textContent = moveHistory.length;
    }

    // Check if cube is solved
    function checkIfSolved() {
        // Check each face to see if all colors are the same
        const faces = ['U', 'F', 'R', 'B', 'L', 'D'];
        for (const face of faces) {
            const firstColor = cube[face][0][0];
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    if (cube[face][row][col] !== firstColor) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Reset cube to solved state
    function resetCube() {
        cube = {
            U: Array(3).fill().map(() => Array(3).fill(0)),
            F: Array(3).fill().map(() => Array(3).fill(1)),
            R: Array(3).fill().map(() => Array(3).fill(2)),
            B: Array(3).fill().map(() => Array(3).fill(3)),
            L: Array(3).fill().map(() => Array(3).fill(4)),
            D: Array(3).fill().map(() => Array(3).fill(5))
        };
        
        moveHistory = [];
        solutionSteps = [];
        currentStep = 0;
        isSolving = false;
        
        initCubeDisplay();
        updateMoveHistory();
        updateSolutionSteps();
        updateCubeInfo();
    }

    // Clear move history
    function clearHistory() {
        moveHistory = [];
        updateMoveHistory();
        updateCubeInfo();
    }

    // Rotate view
    function rotateView(axis, direction) {
        const amount = 45; // degrees
        if (axis === 'x') viewRotation.x += direction * amount;
        if (axis === 'y') viewRotation.y += direction * amount;
        if (axis === 'z') viewRotation.z += direction * amount;
        
        initCubeDisplay();
    }

    // Reset view
    function resetView() {
        viewRotation = { x: 0, y: 0, z: 0 };
        initCubeDisplay();
    }

    // Event listeners for face buttons
    document.querySelectorAll('.face-btn').forEach(button => {
        button.addEventListener('click', () => {
            const face = button.getAttribute('data-face');
            rotateFace(face);
        });
    });

    // Event listeners for view controls
    document.getElementById('rotate-x-left').addEventListener('click', () => rotateView('x', -1));
    document.getElementById('rotate-x-right').addEventListener('click', () => rotateView('x', 1));
    document.getElementById('rotate-y-left').addEventListener('click', () => rotateView('y', -1));
    document.getElementById('rotate-y-right').addEventListener('click', () => rotateView('y', 1));
    document.getElementById('rotate-z-left').addEventListener('click', () => rotateView('z', -1));
    document.getElementById('rotate-z-right').addEventListener('click', () => rotateView('z', 1));
    document.getElementById('reset-view').addEventListener('click', resetView);

    // Event listeners for action buttons
    document.getElementById('scramble').addEventListener('click', scrambleCube);
    document.getElementById('solve').addEventListener('click', solveCube);
    document.getElementById('reset-cube').addEventListener('click', resetCube);
    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('prev-step').addEventListener('click', applyPrevStep);
    document.getElementById('next-step').addEventListener('click', applyNextStep);

    // Initialize the game
    initCubeDisplay();
    updateCubeInfo();
});