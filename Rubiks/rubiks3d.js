document.addEventListener('DOMContentLoaded', () => {
    // Three.js variables
    let scene, camera, renderer, controls;
    let cubeGroup = new THREE.Group();
    let cubes = [];
    let isAnimating = false;
    let animationQueue = [];
    
    // Cube state
    let cubeState = {
        // Each face is a 3x3 array of colors
        // Colors: 0=white, 1=green, 2=red, 3=blue, 4=orange, 5=yellow
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
    
    // Colors for Three.js
    const cubeColors = [
        0xFFFFFF, // White
        0x40c057, // Green
        0xfa5252, // Red
        0x228be6, // Blue
        0xfd7e14, // Orange
        0xffd43b  // Yellow
    ];
    
    // Face mapping
    const faceMap = {
        'U': { normal: new THREE.Vector3(0, 1, 0), color: 0 },
        'F': { normal: new THREE.Vector3(0, 0, 1), color: 1 },
        'R': { normal: new THREE.Vector3(1, 0, 0), color: 2 },
        'B': { normal: new THREE.Vector3(0, 0, -1), color: 3 },
        'L': { normal: new THREE.Vector3(-1, 0, 0), color: 4 },
        'D': { normal: new THREE.Vector3(0, -1, 0), color: 5 }
    };
    
    // DOM Elements
    const container = document.getElementById('cube-3d-container');
    const nextMoveElement = document.getElementById('next-move');
    const currentStepElement = document.getElementById('current-step');
    const totalStepsElement = document.getElementById('total-steps');
    const moveCountElement = document.getElementById('move-count');
    const timerElement = document.getElementById('timer');
    const progressFillElement = document.getElementById('progress-fill');
    const cubeStatusElement = document.getElementById('cube-status');
    const solvingStageElement = document.getElementById('solving-stage');
    const currentFaceElement = document.getElementById('current-face');
    const stepsContainer = document.getElementById('steps-container');
    const animationModal = document.getElementById('animation-modal');
    const animationTitle = document.getElementById('animation-title');
    const animationDescription = document.getElementById('animation-description');
    const notationElement = document.querySelector('.notation');
    
    // Initialize Three.js
    function initThreeJS() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c2461);
        
        // Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(10, 10, 10);
        
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        
        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.maxDistance = 20;
        controls.minDistance = 5;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Create cube
        createRubiksCube();
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
        scene.add(gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Start animation loop
        animate();
    }
    
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    // Create Rubik's Cube
    function createRubiksCube() {
        cubeGroup = new THREE.Group();
        cubes = [];
        
        // Create 27 small cubes (3x3x3)
        const cubeSize = 1;
        const gap = 0.1;
        const totalSize = cubeSize * 3 + gap * 2;
        
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Skip center cube (it's invisible)
                    if (x === 0 && y === 0 && z === 0) continue;
                    
                    const cube = createCube(cubeSize);
                    cube.position.set(
                        x * (cubeSize + gap),
                        y * (cubeSize + gap),
                        z * (cubeSize + gap)
                    );
                    
                    // Store cube information
                    cube.userData = { x, y, z };
                    cubes.push(cube);
                    cubeGroup.add(cube);
                }
            }
        }
        
        // Position the entire cube group
        cubeGroup.position.set(0, 0, 0);
        scene.add(cubeGroup);
        
        // Update cube colors
        updateCubeColors();
    }
    
    // Create a single cube with colored faces
    function createCube(size) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Create materials for each face
        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                shininess: 100,
                specular: 0x222222
            }));
        }
        
        const cube = new THREE.Mesh(geometry, materials);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        return cube;
    }
    
    // Update cube colors based on cubeState
    function updateCubeColors() {
        cubes.forEach(cube => {
            const { x, y, z } = cube.userData;
            
            // Determine which faces are visible for this position
            // Front/Back faces (z = ±1)
            if (z === 1) { // Front face
                const index = getIndexFromPosition(x, y);
                cube.material[4].color.setHex(cubeColors[cubeState.F[index]]);
                cube.material[4].emissive.setHex(highlightedFace === 'F' ? 0x222222 : 0x000000);
            } else if (z === -1) { // Back face
                const index = getIndexFromPosition(-x, y); // Invert x for back
                cube.material[5].color.setHex(cubeColors[cubeState.B[index]]);
                cube.material[5].emissive.setHex(highlightedFace === 'B' ? 0x222222 : 0x000000);
            }
            
            // Right/Left faces (x = ±1)
            if (x === 1) { // Right face
                const index = getIndexFromPosition(-z, y);
                cube.material[0].color.setHex(cubeColors[cubeState.R[index]]);
                cube.material[0].emissive.setHex(highlightedFace === 'R' ? 0x222222 : 0x000000);
            } else if (x === -1) { // Left face
                const index = getIndexFromPosition(z, y);
                cube.material[1].color.setHex(cubeColors[cubeState.L[index]]);
                cube.material[1].emissive.setHex(highlightedFace === 'L' ? 0x222222 : 0x000000);
            }
            
            // Up/Down faces (y = ±1)
            if (y === 1) { // Up face
                const index = getIndexFromPosition(x, -z);
                cube.material[2].color.setHex(cubeColors[cubeState.U[index]]);
                cube.material[2].emissive.setHex(highlightedFace === 'U' ? 0x222222 : 0x000000);
            } else if (y === -1) { // Down face
                const index = getIndexFromPosition(x, z);
                cube.material[3].color.setHex(cubeColors[cubeState.D[index]]);
                cube.material[3].emissive.setHex(highlightedFace === 'D' ? 0x222222 : 0x000000);
            }
        });
    }
    
    // Convert position to cube index
    function getIndexFromPosition(x, y) {
        // Convert from (-1, 0, 1) coordinates to (0, 1, 2) indices
        const row = 1 - y; // Invert y axis
        const col = x + 1;
        return row * 3 + col;
    }
    
    // Rotate a face with animation
    function rotateFaceWithAnimation(face, direction = 1) {
        if (isAnimating) {
            animationQueue.push({ face, direction });
            return;
        }
        
        isAnimating = true;
        highlightedFace = face;
        updateCubeColors();
        
        // Get cubes that belong to this face
        const faceCubes = getCubesForFace(face);
        const axis = faceMap[face].normal;
        const angle = (Math.PI / 2) * direction;
        
        // Create animation group
        const animationGroup = new THREE.Group();
        faceCubes.forEach(cube => {
            animationGroup.add(cube.clone());
            cube.visible = false;
        });
        
        scene.add(animationGroup);
        
        // Animate rotation
        const duration = 500; // milliseconds
        const startTime = Date.now();
        
        function animateRotation() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeInOutCubic(progress);
            
            animationGroup.rotation.set(
                axis.x * angle * easeProgress,
                axis.y * angle * easeProgress,
                axis.z * angle * easeProgress
            );
            
            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                // Update cube state
                rotateFaceInState(face, direction);
                
                // Remove animation group and show real cubes
                scene.remove(animationGroup);
                faceCubes.forEach(cube => cube.visible = true);
                
                // Update colors
                updateCubeColors();
                
                // Update UI
                moveCount++;
                moveCountElement.textContent = moveCount;
                updateProgress();
                
                isAnimating = false;
                highlightedFace = null;
                updateCubeColors();
                
                // Process next animation in queue
                if (animationQueue.length > 0) {
                    const next = animationQueue.shift();
                    setTimeout(() => rotateFaceWithAnimation(next.face, next.direction), 100);
                }
                
                // Check if solution step is complete
                if (isSolving && solutionSteps[currentSolutionStep]) {
                    checkSolutionStep();
                }
            }
        }
        
        animateRotation();
    }
    
    // Easing function
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Get cubes for a specific face
    function getCubesForFace(face) {
        return cubes.filter(cube => {
            const { x, y, z } = cube.userData;
            switch(face) {
                case 'U': return y === 1;
                case 'D': return y === -1;
                case 'F': return z === 1;
                case 'B': return z === -1;
                case 'R': return x === 1;
                case 'L': return x === -1;
                default: return false;
            }
        });
    }
    
    // Rotate face in cube state (logical rotation)
    function rotateFaceInState(face, direction) {
        // Rotate the face itself
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
            rotateFaceInState(face, 1);
            rotateFaceInState(face, 1);
            return;
        }
        
        cubeState[face] = newFace;
        
        // Rotate adjacent edges
        // This is simplified - full implementation would update all adjacent faces
        // For demo purposes, we'll update a few key edges
        switch(face) {
            case 'F':
                // Update top row
                [cubeState.U[6], cubeState.U[7], cubeState.U[8]] = 
                direction === 1 ? 
                    [cubeState.L[8], cubeState.L[5], cubeState.L[2]] :
                    [cubeState.R[0], cubeState.R[3], cubeState.R[6]];
                break;
            case 'U':
                // Update front row
                [cubeState.F[0], cubeState.F[1], cubeState.F[2]] = 
                direction === 1 ?
                    [cubeState.L[0], cubeState.L[1], cubeState.L[2]] :
                    [cubeState.R[0], cubeState.R[1], cubeState.R[2]];
                break;
        }
    }
    
    // Scramble cube
    function scrambleCube() {
        const moves = ['U', 'F', 'R', 'L', 'B', 'D'];
        const directions = [1, -1, 2]; // Clockwise, counter-clockwise, 180
        
        // Reset cube to solved state
        cubeState = {
            U: Array(9).fill(0),
            F: Array(9).fill(1),
            R: Array(9).fill(2),
            B: Array(9).fill(3),
            L: Array(9).fill(4),
            D: Array(9).fill(5)
        };
        
        // Apply 20 random moves
        for (let i = 0; i < 20; i++) {
            const face = moves[Math.floor(Math.random() * moves.length)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            rotateFaceInState(face, direction);
        }
        
        // Update display
        updateCubeColors();
        
        // Update UI
        cubeStatusElement.textContent = 'Scrambled';
        cubeStatusElement.className = 'status scrambled';
        solvingStageElement.textContent = 'Ready to Solve';
        currentStep = 0;
        moveCount = 0;
        moveCountElement.textContent = '0';
        updateProgress();
        
        // Clear steps list
        stepsContainer.innerHTML = `
            <div class="step-item completed">
                <div class="step-header">
                    <span class="step-check"><i class="fas fa-check"></i></span>
                    <span class="step-title">Cube Scrambled</span>
                </div>
            </div>
        `;
        
        // Update step indicators
        updateStepIndicators();
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
        const steps = [];
        
        // Step 1: White Cross
        steps.push({
            step: 1,
            name: 'White Cross',
            moves: ['F', 'U', 'R', 'U\'', 'R\'', 'F\''],
            description: 'Create a white cross on top. Find white edges and position them.',
            currentMove: 0
        });
        
        // Step 2: White Corners
        steps.push({
            step: 2,
            name: 'White Corners',
            moves: ['R', 'U', 'R\'', 'U\''],
            description: 'Place white corners in correct positions.',
            currentMove: 0
        });
        
        // Step 3: Middle Layer
        steps.push({
            step: 3,
            name: 'Middle Layer',
            moves: ['U', 'R', 'U\'', 'R\'', 'U\'', 'F\'', 'U', 'F'],
            description: 'Position middle layer edges.',
            currentMove: 0
        });
        
        // Step 4: Yellow Cross
        steps.push({
            step: 4,
            name: 'Yellow Cross',
            moves: ['F', 'R', 'U', 'R\'', 'U\'', 'F\''],
            description: 'Create yellow cross on bottom.',
            currentMove: 0
        });
        
        // Step 5: Orient Yellow Corners
        steps.push({
            step: 5,
            name: 'Orient Corners',
            moves: ['R', 'U', 'R\'', 'U', 'R', 'U2', 'R\''],
            description: 'Get yellow stickers facing up on corners.',
            currentMove: 0
        });
        
        // Step 6: Position Yellow Corners
        steps.push({
            step: 6,
            name: 'Position Corners',
            moves: ['U', 'R', 'U\'', 'L\'', 'U', 'R\'', 'U\'', 'L'],
            description: 'Place yellow corners in correct spots.',
            currentMove: 0
        });
        
        // Step 7: Position Yellow Edges
        steps.push({
            step: 7,
            name: 'Position Edges',
            moves: ['F2', 'U', 'L', 'R\'', 'F2', 'L\'', 'R', 'U', 'F2'],
            description: 'Final step! Position yellow edges.',
            currentMove: 0
        });
        
        return steps;
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
                showNextInstruction();
            } else {
                finishSolving();
            }
            return;
        }
        
        const move = step.moves[step.currentMove];
        nextMoveElement.textContent = move;
        
        // Parse move
        const face = move[0];
        const direction = move.includes("'") ? -1 : move.includes("2") ? 2 : 1;
        
        // Highlight face
        highlightedFace = face;
        updateCubeColors();
        
        // Update current face display
        currentFaceElement.textContent = getFaceName(face);
        
        // Show instruction
        showInstruction(step, move);
        
        // Show animation modal for complex moves
        if (step.currentMove === 0) {
            showAnimationModal(step, move);
        }
    }
    
    // Check if solution step is complete
    function checkSolutionStep() {
        const step = solutionSteps[currentSolutionStep];
        if (!step) return;
        
        // Check if all moves for this step have been made
        // This is simplified - in real implementation would check cube state
        const allMovesMade = step.currentMove >= step.moves.length;
        
        if (allMovesMade) {
            // Mark step as completed in list
            const stepItems = document.querySelectorAll('.step-item');
            if (stepItems[currentSolutionStep]) {
                stepItems[currentSolutionStep].classList.add('completed');
                stepItems[currentSolutionStep].classList.remove('current');
            }
            
            // Move to next step
            currentSolutionStep++;
            if (currentSolutionStep < solutionSteps.length) {
                setTimeout(() => showNextInstruction(), 1000);
            } else {
                finishSolving();
            }
        }
    }
    
    // Show instruction
    function showInstruction(step, move) {
        const instructionBox = document.querySelector('.instruction-content');
        const moveName = getMoveName(move);
        
        instructionBox.innerHTML = `
            <div class="instruction-icon">
                <i class="fas fa-${getMoveIcon(move[0])}"></i>
            </div>
            <div class="instruction-text">
                <h4>${step.name}</h4>
                <p>${step.description}</p>
                <p><strong>Current Move:</strong> ${moveName}</p>
            </div>
        `;
        
        // Update mini cube animation
        updateMiniCubeAnimation(move);
    }
    
    // Show animation modal
    function showAnimationModal(step, move) {
        const moveName = getMoveName(move);
        const faceName = getFaceName(move[0]);
        
        animationTitle.textContent = `Rotate ${faceName} Face`;
        animationDescription.textContent = `Watch the animation, then perform: ${moveName}`;
        notationElement.textContent = move;
        
        // Create animated cube in modal
        createAnimatedCube(move);
        
        // Show modal
        animationModal.style.display = 'flex';
    }
    
    // Create animated cube for modal
    function createAnimatedCube(move) {
        const container = document.getElementById('animated-cube');
        container.innerHTML = '';
        
        // Create a simple CSS 3D cube
        const cube = document.createElement('div');
        cube.className = 'css-cube';
        cube.style.transform = 'rotateX(-20deg) rotateY(-20deg)';
        
        // Create faces
        const faces = ['front', 'back', 'top', 'bottom', 'left', 'right'];
        faces.forEach(face => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `css-face css-${face}`;
            cube.appendChild(faceDiv);
        });
        
        container.appendChild(cube);
        
        // Animate based on move
        const face = move[0];
        const direction = move.includes("'") ? -1 : move.includes("2") ? 2 : 1;
        const axis = face === 'F' || face === 'B' ? 'Z' : 
                     face === 'R' || face === 'L' ? 'X' : 'Y';
        const angle = 90 * direction;
        
        // Animate
        setTimeout(() => {
            cube.style.transition = 'transform 1s ease';
            cube.style.transform = `rotateX(-20deg) rotateY(-20deg) rotate${axis}(${angle}deg)`;
            
            // Reset after animation
            setTimeout(() => {
                cube.style.transition = 'transform 0.5s ease';
                cube.style.transform = 'rotateX(-20deg) rotateY(-20deg)';
            }, 1500);
        }, 500);
    }
    
    // Update mini cube animation
    function updateMiniCubeAnimation(move) {
        const cubeMini = document.getElementById('cube-mini');
        if (!cubeMini) return;
        
        const face = move[0];
        const direction = move.includes("'") ? -1 : move.includes("2") ? 2 : 1;
        
        // Highlight the face
        const faces = cubeMini.querySelectorAll('.mini-face');
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
            faces[faceIndex].style.boxShadow = '0 0 20px #ffd43b';
        }
        
        // Animate rotation
        cubeMini.style.transition = 'transform 0.5s ease';
        const currentRotate = cubeMini.style.transform || 'rotateX(-20deg) rotateY(-20deg)';
        
        // Add slight bounce effect
        cubeMini.style.transform = `${currentRotate} scale(1.1)`;
        setTimeout(() => {
            cubeMini.style.transform = currentRotate;
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
            <div class="step-description">Congratulations! You solved the cube in ${moveCount} moves.</div>
        `;
        
        stepsContainer.appendChild(stepItem);
        
        // Stop timer
        stopTimer();
        
        // Update progress to 100%
        progressFillElement.style.width = '100%';
        updateStepIndicators();
    }
    
    // Update progress
    function updateProgress() {
        if (!isSolving) return;
        
        const progress = ((currentSolutionStep + 1) / solutionSteps.length) * 100;
        progressFillElement.style.width = `${progress}%`;
        
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
        const face = move[0];
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
    
    // Handle face clicks on 3D cube
    function setupCubeClickHandler() {
        renderer.domElement.addEventListener('click', (event) => {
            if (isAnimating) return;
            
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            const intersects = raycaster.intersectObjects(cubes);
            if (intersects.length > 0) {
                const cube = intersects[0].object;
                const faceIndex = intersects[0].faceIndex;
                
                // Determine which face was clicked
                let face = '';
                const normal = intersects[0].face.normal;
                
                if (normal.x === 1) face = 'R';
                else if (normal.x === -1) face = 'L';
                else if (normal.y === 1) face = 'U';
                else if (normal.y === -1) face = 'D';
                else if (normal.z === 1) face = 'F';
                else if (normal.z === -1) face = 'B';
                
                if (face) {
                    rotateFaceWithAnimation(face, 1);
                    
                    // If solving, check if this matches expected move
                    if (isSolving && solutionSteps[currentSolutionStep]) {
                        const step = solutionSteps[currentSolutionStep];
                        const expectedMove = step.moves[step.currentMove];
                        if (expectedMove && expectedMove[0] === face) {
                            step.currentMove++;
                            showCurrentMove();
                        }
                    }
                }
            }
        });
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
            
            updateCubeColors();
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
                </div>
            `;
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
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Face buttons
        document.querySelectorAll('.face-btn').forEach(button => {
            button.addEventListener('click', () => {
                const face = button.dataset.face;
                const direction = parseInt(button.dataset.direction);
                rotateFaceWithAnimation(face, direction);
            });
        });
        
        // Direction buttons
        document.querySelectorAll('.dir-btn').forEach(button => {
            button.addEventListener('click', () => {
                const direction = parseInt(button.dataset.direction);
                document.querySelectorAll('.face-btn').forEach(btn => {
                    btn.dataset.direction = direction;
                    btn.innerHTML = direction === -1 ? 
                        `<i class="fas fa-undo"></i> ${btn.dataset.face}'` :
                        direction === 2 ?
                        `<i class="fas fa-exchange-alt"></i> ${btn.dataset.face}2` :
                        `<i class="fas fa-redo"></i> ${btn.dataset.face}`;
                });
            });
        });
        
        // Game control buttons
        document.getElementById('scramble-btn').addEventListener('click', scrambleCube);
        document.getElementById('solve-btn').addEventListener('click', startSolving);
        document.getElementById('reset-btn').addEventListener('click', resetCube);
        document.getElementById('hint-btn').addEventListener('click', showHint);
        document.getElementById('reset-view').addEventListener('click', () => {
            controls.reset();
        });
        
        document.getElementById('auto-rotate').addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
        });
        
        // Animation modal buttons
        document.querySelector('.close-animation').addEventListener('click', () => {
            animationModal.style.display = 'none';
        });
        
        document.getElementById('repeat-animation').addEventListener('click', () => {
            const step = solutionSteps[currentSolutionStep];
            const move = step.moves[step.currentMove];
            createAnimatedCube(move);
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
        initThreeJS();
        initEventListeners();
        setupCubeClickHandler();
        scrambleCube(); // Start with scrambled cube
    }
    
    // Start the application
    init();
});