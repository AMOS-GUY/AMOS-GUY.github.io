document.addEventListener('DOMContentLoaded', () => {
    // Cube state representation
    let cubeState = {
        // Each face is a 3x3 array of colors
        // 0=white, 1=green, 2=red, 3=blue, 4=orange, 5=yellow
        U: Array(9).fill(0),
        F: Array(9).fill(1),
        R: Array(9).fill(2),
        B: Array(9).fill(3),
        L: Array(9).fill(4),
        D: Array(9).fill(5)
    };
    
    // Game state
    let isSolving = false;
    let currentStep = 0;
    let totalSteps = 7;
    let moveCount = 0;
    let startTime = null;
    let timerInterval = null;
    let solutionSteps = [];
    let currentSolutionStep = 0;
    let highlightedFace = null;
    let currentDirection = 1; // 1 = clockwise, -1 = counter-clockwise, 2 = 180°
    
    // 3D cube rotation state
    let cubeRotation = { x: -20, y: -20 };
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    // Colors for display
    const colors = {
        0: { name: 'White', hex: '#ffffff', class: 'face-white' },
        1: { name: 'Green', hex: '#40c057', class: 'face-green' },
        2: { name: 'Red', hex: '#fa5252', class: 'face-red' },
        3: { name: 'Blue', hex: '#228be6', class: 'face-blue' },
        4: { name: 'Orange', hex: '#fd7e14', class: 'face-orange' },
        5: { name: 'Yellow', hex: '#ffd43b', class: 'face-yellow' }
    };
    
    // Face mapping ///////////////////////////////////////
    const faceMap = {
        'U': { color: 0, axis: 'Y', direction: 1 },
        'F': { color: 1, axis: 'Z', direction: 1 },
        'R': { color: 2, axis: 'X', direction: 1 },
        'B': { color: 3, axis: 'Z', direction: -1 },
        'L': { color: 4, axis: 'X', direction: -1 },
        'D': { color: 5, axis: 'Y', direction: -1 }
    };
    
    // DOM Elements ///////////////////////////////////////
    const cube3dElement = document.getElementById('cube-3d');
    const nextMoveElement = document.getElementById('next-move');
    const currentStepElement = document.getElementById('current-step');
    const totalStepsElement = document.getElementById('total-steps');
    const moveCountElement = document.getElementById('move-count');
    const timerElement = document.getElementById('timer');
    const progressFillElement = document.getElementById('progress-fill');
    const cubeStatusElement = document.getElementById('cube-status');
    const solvingStageElement = document.getElementById('solving-stage');
    const highlightedFaceElement = document.getElementById('highlighted-face');
    const stepsContainer = document.getElementById('steps-container');
    const animationModal = document.getElementById('animation-modal');
    const animationTitle = document.getElementById('animation-title');
    const animationDescription = document.getElementById('animation-description');
    const notationElement = document.querySelector('.notation');
    const demoCubeElement = document.getElementById('demo-cube');
    
    // Initialize the 3D cube ///////////////////////////////////
    function init3DCube() {
        cube3dElement.innerHTML = '';
        
        // Create 27 small cubes (3x3x3)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Skip the center cube (invisible)
                    if (x === 0 && y === 0 && z === 0) continue;
                    
                    createCubePiece(x, y, z);
                }
            }
        }
        
        updateCubeView();
        setupDragControls();
    }
    
    // Create a single cube piece
    function createCubePiece(x, y, z) {
        const cubePiece = document.createElement('div');
        cubePiece.className = 'cube-piece';
        cubePiece.dataset.x = x;
        cubePiece.dataset.y = y;
        cubePiece.dataset.z = z;
        
        // Position the cube piece
        const position = {
            x: x * 60 - 90, // Center around 0, with 60px cubes and 30px gaps
            y: y * 60 - 90,
            z: z * 60 - 90
        };
        
        cubePiece.style.transform = `translate3d(${position.x}px, ${position.y}px, ${position.z}px)`;
        
        // Create 6 faces for this cube piece
        for (let i = 0; i < 6; i++) {
            const face = document.createElement('div');
            face.className = 'cube-face';
            
            // Determine which face this is and what color it should be
            let faceColor = null;
            let faceClass = '';
            
            if (i === 0 && z === 1) { // Front face
                faceClass = 'front';
                const index = getIndexFromPosition(x, y);
                faceColor = cubeState.F[index];
            } else if (i === 1 && z === -1) { // Back face
                faceClass = 'back';
                const index = getIndexFromPosition(-x, y); // Invert x for back
                faceColor = cubeState.B[index];
            } else if (i === 2 && y === 1) { // Top face
                faceClass = 'top';
                const index = getIndexFromPosition(x, -z);
                faceColor = cubeState.U[index];
            } else if (i === 3 && y === -1) { // Bottom face
                faceClass = 'bottom';
                const index = getIndexFromPosition(x, z);
                faceColor = cubeState.D[index];
            } else if (i === 4 && x === -1) { // Left face
                faceClass = 'left';
                const index = getIndexFromPosition(z, y);
                faceColor = cubeState.L[index];
            } else if (i === 5 && x === 1) { // Right face
                faceClass = 'right';
                const index = getIndexFromPosition(-z, y);
                faceColor = cubeState.R[index];
            }
            
            if (faceClass) {
                face.classList.add(faceClass);
                if (faceColor !== null) {
                    face.classList.add(colors[faceColor].class);
                    // Add small label for debugging
                    if ([0, 4, 8].includes(getIndexFromPosition(x, y, z))) {
                        face.textContent = ['U', 'F', 'R', 'B', 'L', 'D'][i];
                    }
                }
                cubePiece.appendChild(face);
            }
        }
        
        cube3dElement.appendChild(cubePiece);
    }
    
    // Convert position to cube index
    function getIndexFromPosition(x, y, z = null) {
        // Convert from (-1, 0, 1) coordinates to (0, 1, 2) indices
        const row = 1 - y; // Invert y axis
        const col = x + 1;
        return row * 3 + col;
    }
    
    // Update cube view rotation
    function updateCubeView() {
        cube3dElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
    }
    
    // Setup drag controls for cube rotation
    function setupDragControls() {
        const cubeWrapper = document.querySelector('.cube-wrapper');
        
        cubeWrapper.addEventListener('mousedown', startDrag);
        cubeWrapper.addEventListener('touchstart', startDragTouch);
        
        function startDrag(e) {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            e.preventDefault();
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        }
        
        function startDragTouch(e) {
            if (e.touches.length === 1) {
                isDragging = true;
                lastMouseX = e.touches[0].clientX;
                lastMouseY = e.touches[0].clientY;
                e.preventDefault();
                
                document.addEventListener('touchmove', dragTouch);
                document.addEventListener('touchend', stopDrag);
            }
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            cubeRotation.y += deltaX * 0.5;
            cubeRotation.x -= deltaY * 0.5;
            
            updateCubeView();
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
        
        function dragTouch(e) {
            if (!isDragging || e.touches.length !== 1) return;
            
            const deltaX = e.touches[0].clientX - lastMouseX;
            const deltaY = e.touches[0].clientY - lastMouseY;
            
            cubeRotation.y += deltaX * 0.5;
            cubeRotation.x -= deltaY * 0.5;
            
            updateCubeView();
            
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', dragTouch);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
    }
    
    // Rotate a face with animation
    function rotateFace(face, direction = 1) {
        if (isSolving) {
            // Check if this is the expected move
            const step = solutionSteps[currentSolutionStep];
            if (step && step.moves[step.currentMove]) {
                const expectedMove = step.moves[step.currentMove];
                const expectedFace = expectedMove.replace("'", "").replace("2", "");
                const expectedDirection = expectedMove.includes("'") ? -1 : 
                                        expectedMove.includes("2") ? 2 : 1;
                
                if (expectedFace === face && expectedDirection === direction) {
                    step.currentMove++;
                    if (step.currentMove >= step.moves.length) {
                        currentSolutionStep++;
                        if (currentSolutionStep < solutionSteps.length) {
                            showNextInstruction();
                        } else {
                            finishSolving();
                        }
                    } else {
                        showCurrentMove();
                    }
                }
            }
        }
        
        // Animate the face rotation
        animateFaceRotation(face, direction);
        
        // Update cube state
        updateCubeState(face, direction);
        
        // Update UI
        moveCount++;
        moveCountElement.textContent = moveCount;
        updateProgress();
        
        // Update cube display
        setTimeout(() => {
            init3DCube(); // Recreate cube with new state
        }, 500);
    }
    
    // Animate face rotation
    function animateFaceRotation(face, direction) {
        const cubes = document.querySelectorAll('.cube-piece');
        const axis = faceMap[face].axis.toLowerCase();
        const angle = 90 * direction;
        
        // Highlight the face
        highlightedFace = face;
        highlightedFaceElement.textContent = getFaceName(face);
        
        // Animate cubes on that face
        cubes.forEach(cube => {
            const x = parseInt(cube.dataset.x);
            const y = parseInt(cube.dataset.y);
            const z = parseInt(cube.dataset.z);
            
            let shouldRotate = false;
            
            switch(face) {
                case 'U': shouldRotate = y === 1; break;
                case 'D': shouldRotate = y === -1; break;
                case 'F': shouldRotate = z === 1; break;
                case 'B': shouldRotate = z === -1; break;
                case 'R': shouldRotate = x === 1; break;
                case 'L': shouldRotate = x === -1; break;
            }
            
            if (shouldRotate) {
                cube.style.transition = 'transform 0.5s ease';
                const currentTransform = cube.style.transform;
                
                if (axis === 'x') {
                    cube.style.transform = `${currentTransform} rotateX(${angle}deg)`;
                } else if (axis === 'y') {
                    cube.style.transform = `${currentTransform} rotateY(${angle}deg)`;
                } else {
                    cube.style.transform = `${currentTransform} rotateZ(${angle}deg)`;
                }
                
                // Reset after animation
                setTimeout(() => {
                    cube.style.transition = '';
                }, 500);
            }
        });
        
        // Reset highlight after animation
        setTimeout(() => {
            highlightedFace = null;
            highlightedFaceElement.textContent = 'None';
        }, 500);
    }
    
    // Update cube state after rotation
    function updateCubeState(face, direction) {
        const oldFace = [...cubeState[face]];
        const newFace = [];
        
        if (direction === 1) { // Clockwise
            newFace[0] = oldFace[6];
            newFace[1] = oldFace[3];
            newFace[2] = oldFace[0];
            newFace[3] = oldFace[7];
            newFace[4] = oldFace[4];
            newFace[5] = oldFace[1];
            newFace[6] = oldFace[8];
            newFace[7] = oldFace[5];
            newFace[8] = oldFace[2];
        } else if (direction === -1) { // Counter-clockwise
            newFace[0] = oldFace[2];
            newFace[1] = oldFace[5];
            newFace[2] = oldFace[8];
            newFace[3] = oldFace[1];
            newFace[4] = oldFace[4];
            newFace[5] = oldFace[7];
            newFace[6] = oldFace[0];
            newFace[7] = oldFace[3];
            newFace[8] = oldFace[6];
        } else if (direction === 2) { // 180 degrees
            updateCubeState(face, 1);
            updateCubeState(face, 1);
            return;
        }
        
        cubeState[face] = newFace;
        
        // Update adjacent edges (simplified for demo)
        // In a full implementation, this would update all adjacent faces
    }
    
    // Scramble cube
    function scrambleCube() {
        const moves = ['U', 'F', 'R', 'L', 'B', 'D'];
        const directions = [1, -1, 2];
        
        // Reset cube to solved state
        cubeState = {
            U: Array(9).fill(0),
            F: Array(9).fill(1),
            R: Array(9).fill(2),
            B: Array(9).fill(3),
            L: Array(9).fill(4),
            D: Array(9).fill(5)
        };
        
        // Apply 15 random moves
        for (let i = 0; i < 15; i++) {
            const face = moves[Math.floor(Math.random() * moves.length)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            updateCubeState(face, direction);
        }
        
        // Update display
        init3DCube();
        
        // Update UI
        cubeStatusElement.textContent = 'Scrambled';
        cubeStatusElement.className = 'status solving';
        solvingStageElement.textContent = 'Ready to Solve';
        currentStep = 0;
        moveCount = 0;
        moveCountElement.textContent = '0';
        updateProgress();
        updateStepIndicators();
        
        // Clear steps list
        stepsContainer.innerHTML = `
            <div class="step-item completed">
                <div class="step-header">
                    <span class="step-check"><i class="fas fa-check"></i></span>
                    <span class="step-title">Cube Scrambled</span>
                </div>
                <div class="step-description">Cube has been randomly scrambled</div>
            </div>
        `;
        
        // Reset timer if it was running
        stopTimer();
        timerElement.textContent = '00:00';
        
        // Show instruction
        showInstruction({
            name: 'Cube Scrambled',
            description: 'The cube has been randomly scrambled. Click "Start Solving" to begin.',
            move: null
        });
    }
    
    // Start solving
    function startSolving() {
        if (isSolving) return;
        
        isSolving = true;
        cubeStatusElement.textContent = 'Solving...';
        cubeStatusElement.className = 'status solving';
        
        // Generate solution
        solutionSteps = generateSolution();
        currentSolutionStep = 0;
        
        // Start timer
        startTimer();
        
        // Show first instruction
        showNextInstruction();
    }
    
    // Generate solution steps
    function generateSolution() {
        return [
            {
                step: 1,
                name: 'White Cross',
                moves: ['F', 'R', 'U', 'R\'', 'U\'', 'F\''],
                description: 'Create a white cross on top',
                currentMove: 0
            },
            {
                step: 2,
                name: 'White Corners',
                moves: ['R', 'U', 'R\'', 'U\''],
                description: 'Place white corners correctly',
                currentMove: 0
            },
            {
                step: 3,
                name: 'Middle Layer',
                moves: ['U', 'R', 'U\'', 'R\'', 'U\'', 'F\'', 'U', 'F'],
                description: 'Position middle layer edges',
                currentMove: 0
            },
            {
                step: 4,
                name: 'Yellow Cross',
                moves: ['F', 'R', 'U', 'R\'', 'U\'', 'F\''],
                description: 'Create yellow cross on bottom',
                currentMove: 0
            },
            {
                step: 5,
                name: 'Orient Corners',
                moves: ['R', 'U', 'R\'', 'U', 'R', 'U2', 'R\''],
                description: 'Get yellow stickers facing up',
                currentMove: 0
            },
            {
                step: 6,
                name: 'Position Corners',
                moves: ['U', 'R', 'U\'', 'L\'', 'U', 'R\'', 'U\'', 'L'],
                description: 'Place corners in correct spots',
                currentMove: 0
            },
            {
                step: 7,
                name: 'Position Edges',
                moves: ['F2', 'U', 'L', 'R\'', 'F2', 'L\'', 'R', 'U', 'F2'],
                description: 'Final step - position edges',
                currentMove: 0
            }
        ];
    }
    
    // Show next instruction
    function showNextInstruction() {
        if (!isSolving || currentSolutionStep >= solutionSteps.length) {
            if (isSolving) {
                finishSolving();
            }
            return;
        }
        
        const step = solutionSteps[currentSolutionStep];
        currentStep = step.step;
        
        // Update UI
        solvingStageElement.textContent = step.name;
        updateStepIndicators();
        
        // Show current move
        showCurrentMove();
        
        // Add step to list
        addStepToList(step);
    }
    
    // Show current move
    function showCurrentMove() {
        const step = solutionSteps[currentSolutionStep];
        if (!step || step.currentMove >= step.moves.length) {
            // Move to next step
            currentSolutionStep++;
            if (currentSolutionStep < solutionSteps.length) {
                setTimeout(() => showNextInstruction(), 1000);
            } else {
                finishSolving();
            }
            return;
        }
        
        const move = step.moves[step.currentMove];
        nextMoveElement.textContent = move;
        
        // Parse move
        const face = move.replace("'", "").replace("2", "");
        const direction = move.includes("'") ? -1 : 
                         move.includes("2") ? 2 : 1;
        
        // Show instruction
        showInstruction(step, move);
        
        // Show animation modal for first move of each step
        if (step.currentMove === 0) {
            showAnimationModal(step, move);
        }
    }
    
    // Show instruction
    function showInstruction(step, move = null) {
        const instructionBox = document.querySelector('.instruction-content');
        const moveName = move ? getMoveName(move) : '';
        
        instructionBox.innerHTML = `
            <div class="instruction-icon">
                <i class="fas fa-${getMoveIcon(move ? move[0] : 'cube')}"></i>
            </div>
            <div class="instruction-text">
                <h4>${step.name}</h4>
                <p>${step.description}</p>
                ${move ? `<p><strong>Next Move:</strong> ${moveName}</p>` : ''}
            </div>
        `;
        
        // Update mini cube animation
        if (move) {
            updateMiniCubeAnimation(move);
        }
    }
    
    // Show animation modal
    function showAnimationModal(step, move) {
        const moveName = getMoveName(move);
        const faceName = getFaceName(move.replace("'", "").replace("2", ""));
        
        animationTitle.textContent = `Rotate ${faceName} Face`;
        animationDescription.textContent = `Watch the animation, then perform: ${moveName}`;
        notationElement.textContent = move;
        
        // Create animated demo
        createAnimatedDemo(move);
        
        // Show modal
        animationModal.style.display = 'flex';
    }
    
    // Create animated demo
    function createAnimatedDemo(move) {
        demoCubeElement.innerHTML = '';
        
        // Create a simple cube for demonstration
        const cube = document.createElement('div');
        cube.className = 'demo-cube';
        cube.style.transform = 'rotateX(-20deg) rotateY(-20deg)';
        
        // Create faces
        const faces = ['front', 'back', 'top', 'bottom', 'left', 'right'];
        const faceColors = ['#40c057', '#228be6', '#ffffff', '#ffd43b', '#fd7e14', '#fa5252'];
        
        faces.forEach((face, index) => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `mini-face ${face}`;
            faceDiv.style.backgroundColor = faceColors[index];
            faceDiv.style.border = '2px solid rgba(0,0,0,0.3)';
            cube.appendChild(faceDiv);
        });
        
        demoCubeElement.appendChild(cube);
        
        // Show arrow for the move
        const arrows = document.querySelectorAll('.arrow');
        arrows.forEach(arrow => arrow.style.opacity = '0');
        
        const face = move[0];
        let arrowId = '';
        
        switch(face) {
            case 'U': arrowId = 'arrow-up'; break;
            case 'D': arrowId = 'arrow-down'; break;
            case 'L': arrowId = 'arrow-left'; break;
            case 'R': arrowId = 'arrow-right'; break;
            case 'F': 
            case 'B': 
                // For front/back, show circular arrow
                document.getElementById('arrow-up').style.opacity = '1';
                document.getElementById('arrow-down').style.opacity = '1';
                document.getElementById('arrow-left').style.opacity = '1';
                document.getElementById('arrow-right').style.opacity = '1';
                break;
        }
        
        if (arrowId) {
            document.getElementById(arrowId).style.opacity = '1';
        }
        
        // Animate the cube
        setTimeout(() => {
            const direction = move.includes("'") ? -90 : move.includes("2") ? 180 : 90;
            let transform = '';
            
            switch(face) {
                case 'U': transform = `rotateX(-20deg) rotateY(-20deg) rotateX(${direction}deg)`; break;
                case 'D': transform = `rotateX(-20deg) rotateY(-20deg) rotateX(${-direction}deg)`; break;
                case 'L': transform = `rotateX(-20deg) rotateY(-20deg) rotateY(${-direction}deg)`; break;
                case 'R': transform = `rotateX(-20deg) rotateY(-20deg) rotateY(${direction}deg)`; break;
                case 'F': transform = `rotateX(-20deg) rotateY(-20deg) rotateZ(${direction}deg)`; break;
                case 'B': transform = `rotateX(-20deg) rotateY(-20deg) rotateZ(${-direction}deg)`; break;
            }
            
            cube.style.transform = transform;
            
            // Reset after animation
            setTimeout(() => {
                cube.style.transform = 'rotateX(-20deg) rotateY(-20deg)';
            }, 1000);
        }, 500);
    }
    
    // Update mini cube animation
    function updateMiniCubeAnimation(move) {
        const miniCube = document.getElementById('mini-cube');
        if (!miniCube) return;
        
        const face = move[0];
        const direction = move.includes("'") ? -1 : move.includes("2") ? 2 : 1;
        
        // Highlight the face
        const faces = miniCube.querySelectorAll('.mini-face');
        faces.forEach(faceEl => faceEl.style.boxShadow = 'none');
        
        let faceIndex;
        switch(face) {
            case 'F': faceIndex = 0; break;
            case 'B': faceIndex = 1; break;
            case 'U': faceIndex = 2; break;
            case 'D': faceIndex = 3; break;
            case 'L': faceIndex = 4; break;
            case 'R': faceIndex = 5; break;
        }
        
        if (faces[faceIndex]) {
            faces[faceIndex].style.boxShadow = '0 0 15px #ffd43b';
        }
        
        // Animate rotation
        miniCube.style.transition = 'transform 0.5s ease';
        
        // Add slight bounce effect
        miniCube.style.transform = 'rotateX(-20deg) rotateY(-20deg) scale(1.1)';
        setTimeout(() => {
            miniCube.style.transform = 'rotateX(-20deg) rotateY(-20deg)';
        }, 300);
    }
    
    // Add step to list
    function addStepToList(step) {
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item current';
        stepItem.innerHTML = `
            <div class="step-header">
                <span class="step-check"><i class="fas fa-play"></i></span>
                <span class="step-title">${step.name}</span>
            </div>
            <div class="step-description">${step.description}</div>
        `;
        
        // Remove current class from previous steps
        document.querySelectorAll('.step-item.current').forEach(item => {
            item.classList.remove('current');
            item.classList.add('completed');
        });
        
        stepsContainer.appendChild(stepItem);
        stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Finish solving
    function finishSolving() {
        isSolving = false;
        cubeStatusElement.textContent = 'Solved!';
        cubeStatusElement.className = 'status solved';
        solvingStageElement.textContent = 'Complete';
        
        // Add final step to list
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item completed';
        stepItem.innerHTML = `
            <div class="step-header">
                <span class="step-check"><i class="fas fa-check"></i></span>
                <span class="step-title">Cube Solved!</span>
            </div>
            <div class="step-description">Congratulations! Cube solved in ${moveCount} moves.</div>
        `;
        
        stepsContainer.appendChild(stepItem);
        
        // Stop timer
        stopTimer();
        
        // Update progress to 100%
        progressFillElement.style.width = '100%';
        updateStepIndicators();
        
        // Show celebration message
        showInstruction({
            name: 'Congratulations!',
            description: `You solved the cube in ${moveCount} moves!`,
            move: null
        });
        nextMoveElement.textContent = '🎉';
    }
    
    // Update progress
    function updateProgress() {
        if (!isSolving) return;
        
        const stepProgress = solutionSteps[currentSolutionStep] ? 
            solutionSteps[currentSolutionStep].currentMove / solutionSteps[currentSolutionStep].moves.length : 0;
        const overallProgress = (currentSolutionStep + stepProgress) / solutionSteps.length * 100;
        
        progressFillElement.style.width = `${overallProgress}%`;
        currentStepElement.textContent = currentSolutionStep + 1;
        totalStepsElement.textContent = solutionSteps.length;
    }
    
    // Update step indicators
    function updateStepIndicators() {
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            indicator.classList.remove('active');
            if (index + 1 === currentStep) {
                indicator.classList.add('active');
            }
        });
    }
    
    // Timer functions
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    function updateTimer() {
        if (!startTime) return;
        
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    // Reset cube
    function resetCube() {
        if (confirm('Reset cube to solved state?')) {
            cubeState = {
                U: Array(9).fill(0),
                F: Array(9).fill(1),
                R: Array(9).fill(2),
                B: Array(9).fill(3),
                L: Array(9).fill(4),
                D: Array(9).fill(5)
            };
            
            init3DCube();
            cubeStatusElement.textContent = 'Solved';
            cubeStatusElement.className = 'status solved';
            solvingStageElement.textContent = 'Ready';
            isSolving = false;
            currentStep = 0;
            moveCount = 0;
            moveCountElement.textContent = '0';
            stopTimer();
            timerElement.textContent = '00:00';
            progressFillElement.style.width = '0%';
            updateStepIndicators();
            
            // Clear steps list
            stepsContainer.innerHTML = `
                <div class="step-item completed">
                    <div class="step-header">
                        <span class="step-check"><i class="fas fa-check"></i></span>
                        <span class="step-title">Cube Reset</span>
                    </div>
                    <div class="step-description">Cube has been reset to solved state</div>
                </div>
            `;
            
            // Reset view
            cubeRotation = { x: -20, y: -20 };
            updateCubeView();
        }
    }
    
    // Show hint
    function showHint() {
        if (!isSolving) {
            alert('Start solving first to get hints!');
            return;
        }
        
        const step = solutionSteps[currentSolutionStep];
        if (!step) return;
        
        const move = step.moves[step.currentMove];
        if (move) {
            alert(`Hint: Next move is ${getMoveName(move)}\n\n${step.description}`);
            showAnimationModal(step, move);
        }
    }
    
    // Helper functions
    function getFaceName(face) {
        const names = {
            'U': 'Up (White)',
            'F': 'Front (Green)',
            'R': 'Right (Red)',
            'L': 'Left (Orange)',
            'B': 'Back (Blue)',
            'D': 'Down (Yellow)'
        };
        return names[face] || face;
    }
    
    function getMoveName(move) {
        const face = move.replace("'", "").replace("2", "");
        const direction = move.includes("'") ? 'counter-clockwise' : 
                         move.includes("2") ? '180 degrees' : 'clockwise';
        return `${getFaceName(face)} ${direction}`;
    }
    
    function getMoveIcon(face) {
        const icons = {
            'U': 'arrow-up',
            'F': 'forward',
            'R': 'arrow-right',
            'L': 'arrow-left',
            'B': 'backward',
            'D': 'arrow-down'
        };
        return icons[face] || 'cube';
    }
    
    // View control functions
    function setView(view) {
        switch(view) {
            case 'front':
                cubeRotation = { x: -20, y: -20 };
                break;
            case 'top':
                cubeRotation = { x: -70, y: -20 };
                break;
            case 'right':
                cubeRotation = { x: -20, y: -70 };
                break;
        }
        updateCubeView();
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // View control buttons
        document.getElementById('view-front').addEventListener('click', () => setView('front'));
        document.getElementById('view-top').addEventListener('click', () => setView('top'));
        document.getElementById('view-right').addEventListener('click', () => setView('right'));
        document.getElementById('rotate-left').addEventListener('click', () => {
            cubeRotation.y -= 45;
            updateCubeView();
        });
        document.getElementById('rotate-right').addEventListener('click', () => {
            cubeRotation.y += 45;
            updateCubeView();
        });
        document.getElementById('reset-view').addEventListener('click', () => {
            cubeRotation = { x: -20, y: -20 };
            updateCubeView();
        });
        
        // Face buttons
        document.querySelectorAll('.face-btn').forEach(button => {
            button.addEventListener('click', () => {
                const face = button.dataset.face;
                rotateFace(face, currentDirection);
            });
        });
        
        // Direction buttons
        document.querySelectorAll('.dir-btn').forEach(button => {
            button.addEventListener('click', () => {
                currentDirection = parseInt(button.dataset.direction);
                
                // Update button states
                document.querySelectorAll('.dir-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Update face button labels
                document.querySelectorAll('.face-btn').forEach(btn => {
                    const face = btn.dataset.face;
                    let label = face;
                    if (currentDirection === -1) label = face + "'";
                    if (currentDirection === 2) label = face + "2";
                    
                    btn.innerHTML = currentDirection === -1 ? 
                        `<i class="fas fa-undo"></i> ${label}` :
                        currentDirection === 2 ?
                        `<i class="fas fa-exchange-alt"></i> ${label}` :
                        `<i class="fas fa-redo"></i> ${label}`;
                });
            });
        });
        
        // Game control buttons
        document.getElementById('scramble-btn').addEventListener('click', scrambleCube);
        document.getElementById('solve-btn').addEventListener('click', startSolving);
        document.getElementById('reset-btn').addEventListener('click', resetCube);
        document.getElementById('hint-btn').addEventListener('click', showHint);
        
        // Animation modal buttons
        document.querySelector('.close-animation').addEventListener('click', () => {
            animationModal.style.display = 'none';
        });
        
        document.getElementById('repeat-animation').addEventListener('click', () => {
            const step = solutionSteps[currentSolutionStep];
            const move = step.moves[step.currentMove];
            createAnimatedDemo(move);
        });
        
        document.getElementById('got-it-btn').addEventListener('click', () => {
            animationModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === animationModal) {
                animationModal.style.display = 'none';
            }
        });
    }
    
    // Initialize everything
    function init() {
        init3DCube();
        initEventListeners();
        
        // Start with scrambled cube
        setTimeout(scrambleCube, 500);
    }
    
    // Start the application
    init();
});