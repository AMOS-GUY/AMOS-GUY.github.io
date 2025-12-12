document.addEventListener('DOMContentLoaded', () => {
    // Color mapping
    const colors = {
        white: { code: 'W', rgb: '#ffffff', name: 'White' },
        green: { code: 'G', rgb: '#40c057', name: 'Green' },
        red: { code: 'R', rgb: '#fa5252', name: 'Red' },
        blue: { code: 'B', rgb: '#228be6', name: 'Blue' },
        orange: { code: 'O', rgb: '#fd7e14', name: 'Orange' },
        yellow: { code: 'Y', rgb: '#ffd43b', name: 'Yellow' }
    };

    // Cube state
    let cubeState = {
        U: Array(9).fill('W'), // White
        F: Array(9).fill('G'), // Green
        R: Array(9).fill('R'), // Red
        B: Array(9).fill('B'), // Blue
        L: Array(9).fill('O'), // Orange
        D: Array(9).fill('Y')  // Yellow
    };

    // Game state
    let selectedColor = 'yellow';
    let solutionSteps = [];
    let currentStep = 0;
    let validationErrors = [];
    let rotationAngle = 0;

    // DOM elements
    const cubeFacesElement = document.getElementById('cube-faces');
    const cube3dElement = document.getElementById('cube-3d');
    const stepsContainer = document.getElementById('steps-container');
    const currentStepElement = document.getElementById('current-step');
    const totalStepsElement = document.getElementById('total-steps');
    const cubeStatusElement = document.getElementById('cube-status');
    const validationResultElement = document.getElementById('validation-result');
    const currentColorElement = document.getElementById('current-color');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeModal = document.querySelector('.close-modal');

    // Initialize cube editor
    function initCubeEditor() {
        cubeFacesElement.innerHTML = '';
        
        const faceOrder = ['U', 'L', 'F', 'R', 'B', 'D'];
        const faceLabels = {
            U: 'Up (White Center)',
            L: 'Left (Orange Center)',
            F: 'Front (Green Center)',
            R: 'Right (Red Center)',
            B: 'Back (Blue Center)',
            D: 'Down (Yellow Center)'
        };
        
        faceOrder.forEach(face => {
            const faceElement = document.createElement('div');
            faceElement.className = 'cube-face';
            
            const label = document.createElement('div');
            label.className = 'face-label';
            label.textContent = faceLabels[face];
            
            const stickers = document.createElement('div');
            stickers.className = 'stickers';
            
            // Create 3x3 grid (9 stickers)
            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = `sticker ${i === 4 ? 'center' : ''}`;
                sticker.dataset.face = face;
                sticker.dataset.position = i;
                
                const colorCode = cubeState[face][i];
                const colorName = Object.keys(colors).find(key => colors[key].code === colorCode);
                sticker.style.backgroundColor = colors[colorName].rgb;
                sticker.title = `${faceLabels[face]} - Position ${i+1}`;
                
                sticker.addEventListener('click', () => {
                    setStickerColor(face, i, selectedColor);
                });
                
                stickers.appendChild(sticker);
            }
            
            faceElement.appendChild(label);
            faceElement.appendChild(stickers);
            cubeFacesElement.appendChild(faceElement);
        });
        
        update3DCube();
    }

    // Set sticker color
    function setStickerColor(face, position, color) {
        cubeState[face][position] = colors[color].code;
        
        // Update the sticker display
        const sticker = document.querySelector(`.sticker[data-face="${face}"][data-position="${position}"]`);
        if (sticker) {
            sticker.style.backgroundColor = colors[color].rgb;
        }
        
        // Update 3D cube
        update3DCube();
        
        // Clear validation result since cube has changed
        validationResultElement.textContent = 'Not validated';
        validationResultElement.style.color = '#adb5bd';
    }

    // Update 3D cube visualization
    function update3DCube() {
        cube3dElement.innerHTML = '';
        
        const cubeContainer = document.createElement('div');
        cubeContainer.className = 'cube-3d-container';
        cubeContainer.style.transform = `rotateY(${rotationAngle}deg)`;
        cubeContainer.style.transition = 'transform 0.5s ease';
        
        // Create faces in 3D arrangement
        const faces3D = [
            { face: 'U', rotation: 'rotateX(90deg)', transform: 'translateY(-60px)' },
            { face: 'D', rotation: 'rotateX(-90deg)', transform: 'translateY(60px)' },
            { face: 'F', rotation: 'rotateY(0deg)', transform: 'translateZ(60px)' },
            { face: 'B', rotation: 'rotateY(180deg)', transform: 'translateZ(-60px)' },
            { face: 'L', rotation: 'rotateY(-90deg)', transform: 'translateX(-60px)' },
            { face: 'R', rotation: 'rotateY(90deg)', transform: 'translateX(60px)' }
        ];
        
        faces3D.forEach(faceData => {
            const face3D = document.createElement('div');
            face3D.className = 'face-3d';
            face3D.style.transform = `${faceData.rotation} ${faceData.transform}`;
            face3D.style.position = 'absolute';
            
            // Create 3x3 grid for the face
            const grid = document.createElement('div');
            grid.className = 'face-grid';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(3, 20px)';
            grid.style.gap = '2px';
            grid.style.transform = 'rotateX(180deg)'; // Fix orientation
            
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.style.width = '20px';
                cell.style.height = '20px';
                cell.style.borderRadius = '2px';
                cell.style.border = '1px solid rgba(0,0,0,0.3)';
                
                const colorCode = cubeState[faceData.face][i];
                const colorName = Object.keys(colors).find(key => colors[key].code === colorCode);
                cell.style.backgroundColor = colors[colorName].rgb;
                
                grid.appendChild(cell);
            }
            
            face3D.appendChild(grid);
            cubeContainer.appendChild(face3D);
        });
        
        cube3dElement.appendChild(cubeContainer);
    }

    // Validate cube
    function validateCube() {
        validationErrors = [];
        
        // Check center pieces (should be unique per face)
        const centers = ['U4', 'F4', 'R4', 'B4', 'L4', 'D4'];
        const centerColors = centers.map(pos => {
            const face = pos[0];
            const index = parseInt(pos[1]);
            return cubeState[face][index];
        });
        
        // Check for duplicate centers
        const uniqueCenters = [...new Set(centerColors)];
        if (uniqueCenters.length !== 6) {
            validationErrors.push('Duplicate center colors detected. Each face must have a unique center color.');
        }
        
        // Check corner pieces (should have 8 of each color combination)
        const corners = [
            ['U0', 'L0', 'B2'], ['U2', 'B0', 'R2'], ['U6', 'F0', 'L2'], ['U8', 'R0', 'F2'],
            ['D0', 'B8', 'L6'], ['D2', 'L8', 'F6'], ['D6', 'F8', 'R6'], ['D8', 'R8', 'B6']
        ];
        
        const cornerColors = corners.map(corner => 
            corner.map(pos => {
                const face = pos[0];
                const index = parseInt(pos[1]);
                return cubeState[face][index];
            }).sort().join('')
        );
        
        const cornerCounts = {};
        cornerColors.forEach(color => {
            cornerCounts[color] = (cornerCounts[color] || 0) + 1;
        });
        
        if (Object.keys(cornerCounts).length !== 8 || Object.values(cornerCounts).some(count => count !== 1)) {
            validationErrors.push('Invalid corner configuration detected.');
        }
        
        // Check edge pieces (should have 12 of each color combination)
        const edges = [
            ['U1', 'B1'], ['U3', 'L1'], ['U5', 'R1'], ['U7', 'F1'],
            ['F3', 'L5'], ['F5', 'R3'], ['B3', 'R5'], ['B5', 'L3'],
            ['D1', 'F7'], ['D3', 'L7'], ['D5', 'R7'], ['D7', 'B7']
        ];
        
        const edgeColors = edges.map(edge => 
            edge.map(pos => {
                const face = pos[0];
                const index = parseInt(pos[1]);
                return cubeState[face][index];
            }).sort().join('')
        );
        
        const edgeCounts = {};
        edgeColors.forEach(color => {
            edgeCounts[color] = (edgeCounts[color] || 0) + 1;
        });
        
        if (Object.keys(edgeCounts).length !== 12 || Object.values(edgeCounts).some(count => count !== 1)) {
            validationErrors.push('Invalid edge configuration detected.');
        }
        
        // Check total counts of each color (should be 9 of each)
        const allColors = Object.values(cubeState).flat();
        const colorCounts = {};
        allColors.forEach(color => {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        
        Object.keys(colors).forEach(colorName => {
            const colorCode = colors[colorName].code;
            if (colorCounts[colorCode] !== 9) {
                validationErrors.push(`${colors[colorName].name} should appear exactly 9 times (currently ${colorCounts[colorCode] || 0})`);
            }
        });
        
        // Update UI
        if (validationErrors.length === 0) {
            validationResultElement.textContent = 'Cube is valid!';
            validationResultElement.style.color = '#40c057';
            cubeStatusElement.textContent = 'Ready to Solve';
            cubeStatusElement.className = 'status valid';
            return true;
        } else {
            validationResultElement.textContent = `${validationErrors.length} error(s) found`;
            validationResultElement.style.color = '#fa5252';
            cubeStatusElement.textContent = 'Validation Failed';
            cubeStatusElement.className = 'status invalid';
            showErrorModal();
            return false;
        }
    }

    // Show error modal
    function showErrorModal() {
        errorMessage.innerHTML = '';
        
        validationErrors.forEach((error, index) => {
            const errorItem = document.createElement('p');
            errorItem.textContent = `${index + 1}. ${error}`;
            errorItem.style.marginBottom = '10px';
            errorItem.style.padding = '10px';
            errorItem.style.background = 'rgba(250, 82, 82, 0.1)';
            errorItem.style.borderRadius = '5px';
            errorMessage.appendChild(errorItem);
        });
        
        errorModal.style.display = 'flex';
    }

    // Fix cube errors automatically
    function fixCubeErrors() {
        // Reset cube to solved state
        cubeState = {
            U: Array(9).fill('W'),
            F: Array(9).fill('G'),
            R: Array(9).fill('R'),
            B: Array(9).fill('B'),
            L: Array(9).fill('O'),
            D: Array(9).fill('Y')
        };
        
        initCubeEditor();
        errorModal.style.display = 'none';
        validationResultElement.textContent = 'Cube reset to solved state';
        validationResultElement.style.color = '#40c057';
    }

    // Generate solution steps
    function generateSolution() {
        if (validationErrors.length > 0 && !confirm('Cube has validation errors. Generate solution anyway?')) {
            return;
        }
        
        cubeStatusElement.textContent = 'Generating Solution...';
        cubeStatusElement.className = 'status solving';
        
        // Simulate solution generation (in a real app, this would use a solving algorithm)
        solutionSteps = generateMockSolution();
        currentStep = 0;
        
        updateSolutionDisplay();
        cubeStatusElement.textContent = 'Solution Ready';
        cubeStatusElement.className = 'status valid';
    }

    // Generate mock solution (simplified for demo)
    function generateMockSolution() {
        const steps = [];
        
        // Cross (first layer edges)
        steps.push({
            step: 1,
            move: "F' U' F",
            description: "Place white-green edge in correct position"
        });
        
        steps.push({
            step: 2,
            move: "R U R'",
            description: "Place white-red edge in correct position"
        });
        
        steps.push({
            step: 3,
            move: "L' U' L",
            description: "Place white-orange edge in correct position"
        });
        
        steps.push({
            step: 4,
            move: "B U B'",
            description: "Place white-blue edge in correct position"
        });
        
        // First layer corners
        steps.push({
            step: 5,
            move: "R U R' U'",
            description: "Place white-green-red corner"
        });
        
        steps.push({
            step: 6,
            move: "L' U' L U",
            description: "Place white-green-orange corner"
        });
        
        steps.push({
            step: 7,
            move: "R U2 R' U'",
            description: "Place white-blue-red corner"
        });
        
        steps.push({
            step: 8,
            move: "L' U2 L U",
            description: "Place white-blue-orange corner"
        });
        
        // Second layer
        steps.push({
            step: 9,
            move: "U R U' R' U' F' U F",
            description: "Place green-red edge"
        });
        
        steps.push({
            step: 10,
            move: "U' L' U L U F U' F'",
            description: "Place green-orange edge"
        });
        
        steps.push({
            step: 11,
            move: "U R U' R' U' F' U F",
            description: "Place blue-red edge"
        });
        
        steps.push({
            step: 12,
            move: "U' L' U L U F U' F'",
            description: "Place blue-orange edge"
        });
        
        // Yellow cross
        steps.push({
            step: 13,
            move: "F R U R' U' F'",
            description: "Make yellow cross"
        });
        
        // Orient yellow corners
        steps.push({
            step: 14,
            move: "R U R' U R U2 R'",
            description: "Orient yellow corners"
        });
        
        // Permute yellow corners
        steps.push({
            step: 15,
            move: "U R U' L' U R' U' L",
            description: "Permute yellow corners"
        });
        
        // Permute yellow edges
        steps.push({
            step: 16,
            move: "F2 U L R' F2 L' R U F2",
            description: "Permute yellow edges - Final step!"
        });
        
        return steps;
    }

    // Update solution display
    function updateSolutionDisplay() {
        stepsContainer.innerHTML = '';
        
        if (solutionSteps.length === 0) {
            stepsContainer.innerHTML = `
                <div class="empty-solution">
                    <i class="fas fa-cube"></i>
                    <p>Enter your cube colors and click "Generate Solution" to see the solving steps.</p>
                </div>
            `;
            return;
        }
        
        solutionSteps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = `solution-step ${index === currentStep ? 'active' : ''}`;
            
            stepElement.innerHTML = `
                <div class="step-header">
                    <span class="step-number">Step ${step.step}</span>
                    <span class="step-move">${step.move}</span>
                </div>
                <div class="step-description">${step.description}</div>
            `;
            
            stepsContainer.appendChild(stepElement);
        });
        
        // Scroll to current step
        const currentStepElement = document.querySelector('.solution-step.active');
        if (currentStepElement) {
            currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Update counters
        currentStepElement.textContent = currentStep + 1;
        totalStepsElement.textContent = solutionSteps.length;
    }

    // Random scramble
    function randomScramble() {
        const moves = ["U", "U'", "U2", "F", "F'", "F2", "R", "R'", "R2", 
                      "L", "L'", "L2", "B", "B'", "B2", "D", "D'", "D2"];
        
        // Reset to solved state first
        cubeState = {
            U: Array(9).fill('W'),
            F: Array(9).fill('G'),
            R: Array(9).fill('R'),
            B: Array(9).fill('B'),
            L: Array(9).fill('O'),
            D: Array(9).fill('Y')
        };
        
        // Apply random moves (simplified - in real app this would actually rotate the cube)
        const scrambleLength = 20;
        const scrambleMoves = [];
        
        for (let i = 0; i < scrambleLength; i++) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            scrambleMoves.push(move);
            
            // Simulate the move by randomly swapping some stickers
            // This is a simplified simulation - real cube rotation logic would be more complex
            if (move.includes('U')) {
                // Rotate top layer
                const temp = cubeState.U.slice();
                cubeState.U = [...temp.slice(6), ...temp.slice(3, 6), ...temp.slice(0, 3)];
            }
        }
        
        initCubeEditor();
        
        // Show scramble message
        cubeStatusElement.textContent = 'Randomly Scrambled';
        cubeStatusElement.className = 'status solving';
        
        setTimeout(() => {
            cubeStatusElement.textContent = 'Ready to Solve';
            cubeStatusElement.className = 'status valid';
        }, 2000);
    }

    // Reset all colors
    function resetColors() {
        if (confirm('Reset all colors to solved state?')) {
            cubeState = {
                U: Array(9).fill('W'),
                F: Array(9).fill('G'),
                R: Array(9).fill('R'),
                B: Array(9).fill('B'),
                L: Array(9).fill('O'),
                D: Array(9).fill('Y')
            };
            
            initCubeEditor();
            validationResultElement.textContent = 'Not validated';
            validationResultElement.style.color = '#adb5bd';
            cubeStatusElement.textContent = 'Ready to Solve';
            cubeStatusElement.className = 'status valid';
        }
    }

    // Clear solution
    function clearSolution() {
        if (solutionSteps.length > 0 && confirm('Clear current solution?')) {
            solutionSteps = [];
            currentStep = 0;
            updateSolutionDisplay();
        }
    }

    // Next step
    function nextStep() {
        if (currentStep < solutionSteps.length - 1) {
            currentStep++;
            updateSolutionDisplay();
        }
    }

    // Previous step
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateSolutionDisplay();
        }
    }

    // Rotate cube view
    function rotateView(direction) {
        rotationAngle += direction * 90;
        update3DCube();
    }

    // Initialize color selection
    function initColorSelection() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Add active class to clicked
                option.classList.add('active');
                selectedColor = option.dataset.color;
                
                // Update current color display
                currentColorElement.textContent = colors[selectedColor].name;
                currentColorElement.style.backgroundColor = colors[selectedColor].rgb;
            });
        });
    }

    // Event listeners
    function initEventListeners() {
        // Color palette
        initColorSelection();
        
        // Editor controls
        document.getElementById('reset-colors').addEventListener('click', resetColors);
        document.getElementById('validate-cube').addEventListener('click', validateCube);
        document.getElementById('random-cube').addEventListener('click', randomScramble);
        
        // Solution controls
        document.getElementById('solve-btn').addEventListener('click', generateSolution);
        document.getElementById('clear-solution').addEventListener('click', clearSolution);
        document.getElementById('prev-step').addEventListener('click', prevStep);
        document.getElementById('next-step').addEventListener('click', nextStep);
        
        // View controls
        document.getElementById('rotate-left').addEventListener('click', () => rotateView(-1));
        document.getElementById('rotate-right').addEventListener('click', () => rotateView(1));
        document.getElementById('reset-view').addEventListener('click', () => {
            rotationAngle = 0;
            update3DCube();
        });
        
        // Modal controls
        closeModal.addEventListener('click', () => {
            errorModal.style.display = 'none';
        });
        
        document.getElementById('fix-errors').addEventListener('click', fixCubeErrors);
        
        document.getElementById('ignore-errors').addEventListener('click', () => {
            errorModal.style.display = 'none';
            generateSolution();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === errorModal) {
                errorModal.style.display = 'none';
            }
        });
    }

    // Initialize the application
    initCubeEditor();
    initEventListeners();
});