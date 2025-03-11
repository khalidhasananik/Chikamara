import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function initPlayer(scene, camera, world, renderer) {
    // Create player mesh
    const playerMesh = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.2;

    playerMesh.add(body, head);
    scene.add(playerMesh);

    // Initialize position
    playerMesh.position.set(0, 2, 0);

    // Create physics body with a simple shape
    const physicsBody = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0, 2, 0)
    });

    // Add cylinder shape
    const shape = new CANNON.Cylinder(0.5, 0.5, 1.5, 16);
    physicsBody.addShape(shape);

    // Reset damp
    physicsBody.linearDamping = 0.1;
    physicsBody.angularDamping = 0.1;

    // Add physics body to world
    world.addBody(physicsBody);

    // Debug element to show key presses
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'absolute';
    debugDiv.style.top = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.color = 'white';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '14px';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    debugDiv.style.padding = '10px';
    debugDiv.style.zIndex = '1000';
    document.body.appendChild(debugDiv);

    // Movement variables
    let isFirstPerson = false;
    let canJump = true;
    const keysPressed = {};

    // Using direct forces instead of velocity
    let forceDirection = new CANNON.Vec3(0, 0, 0);

    // Simple key detection
    document.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;

        // Update debug info
        updateDebugInfo();

        // Toggle camera view
        if (e.code === 'KeyF') {
            isFirstPerson = !isFirstPerson;
            console.log('Camera mode:', isFirstPerson ? 'First Person' : 'Third Person');
        }

        // Handle jump
        if (e.code === 'Space' && canJump) {
            // Apply strong upward impulse
            physicsBody.applyImpulse(new CANNON.Vec3(0, 40, 0), physicsBody.position);
            canJump = false;
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
        updateDebugInfo();
    });

    // Mouse rotation
    let totalRotation = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            totalRotation += e.movementX * 0.01;
        }
    });

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Debug function
    function updateDebugInfo() {
        let text = 'Keys pressed: ';
        for (const key in keysPressed) {
            if (keysPressed[key]) text += key + ' ';
        }
        text += '<br>Position: ' +
            Math.round(physicsBody.position.x * 10) / 10 + ', ' +
            Math.round(physicsBody.position.y * 10) / 10 + ', ' +
            Math.round(physicsBody.position.z * 10) / 10;
        text += '<br>Velocity: ' +
            Math.round(physicsBody.velocity.x * 10) / 10 + ', ' +
            Math.round(physicsBody.velocity.y * 10) / 10 + ', ' +
            Math.round(physicsBody.velocity.z * 10) / 10;

        debugDiv.innerHTML = text;
    }

    function update(deltaTime) {
        // Use impulses instead of velocity
        const impulseStrength = 10;

        // Update player orientation from totalRotation
        const rotation = new THREE.Quaternion();
        rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), totalRotation);
        playerMesh.quaternion.copy(rotation);

        // Create a directional vector based on current rotation
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);

        // Apply rotation to direction vectors
        forward.applyQuaternion(rotation);
        right.applyQuaternion(rotation);

        // Apply movement forces based on keys
        if (keysPressed['KeyW']) {
            const impulse = new CANNON.Vec3(forward.x * impulseStrength, 0, forward.z * impulseStrength);
            physicsBody.applyImpulse(impulse, physicsBody.position);
        }
        if (keysPressed['KeyS']) {
            const impulse = new CANNON.Vec3(-forward.x * impulseStrength, 0, -forward.z * impulseStrength);
            physicsBody.applyImpulse(impulse, physicsBody.position);
        }
        if (keysPressed['KeyA']) {
            const impulse = new CANNON.Vec3(-right.x * impulseStrength, 0, -right.z * impulseStrength);
            physicsBody.applyImpulse(impulse, physicsBody.position);
        }
        if (keysPressed['KeyD']) {
            const impulse = new CANNON.Vec3(right.x * impulseStrength, 0, right.z * impulseStrength);
            physicsBody.applyImpulse(impulse, physicsBody.position);
        }

        // Apply horizontal damping for better control
        physicsBody.velocity.x *= 0.9;
        physicsBody.velocity.z *= 0.9;

        // Prevent rotation of physics body (keep upright)
        physicsBody.quaternion.set(0, 0, 0, 1);

        // Reset jump when on ground
        if (physicsBody.position.y < 0.85 && physicsBody.velocity.y < 0.1) {
            canJump = true;
        }

        // Update mesh position to match physics body
        playerMesh.position.copy(physicsBody.position);

        // Update debug display
        updateDebugInfo();
    }

    return {
        mesh: playerMesh,
        body: physicsBody,
        update: update,
        isFirstPerson: () => isFirstPerson,
        position: playerMesh.position
    };
}