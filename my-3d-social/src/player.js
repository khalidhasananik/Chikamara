import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as TWEEN from '@tweenjs/tween.js';

export function initPlayer(scene, camera, world, renderer) {
    // Player model
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x002200,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.2;

    group.add(body, head);
    scene.add(group);

    // Physics
    const shape = new CANNON.Cylinder(0.5, 0.5, 1.5, 32);
    const bodyPhys = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 1, 0),
        angularDamping: 0.5, // Reduced to allow easier rotation
        linearDamping: 0.5 // Reduced to allow easier movement
    });
    bodyPhys.addShape(shape);
    world.addBody(bodyPhys);

    // Controls
    const controls = {
        velocity: new CANNON.Vec3(),
        speed: 5,
        sprintSpeed: 8,
        jumpVelocity: 5,
        canJump: true,
        isSprinting: false
    };

    // Camera mode
    let isFirstPerson = false;

    // Mouse movement for rotation
    let mouseX = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            mouseX = e.movementX * 0.002; // Increased sensitivity
            console.log('Mouse movement detected:', mouseX);
        }
    });

    // Lock pointer
    document.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
        console.log('Pointer locked');
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        console.log('Key pressed:', e.code);
        switch (e.code) {
            case 'KeyW': controls.velocity.z = -1; break;
            case 'KeyS': controls.velocity.z = 1; break;
            case 'KeyA': controls.velocity.x = -1; break;
            case 'KeyD': controls.velocity.x = 1; break;
            case 'ShiftLeft':
            case 'ShiftRight': controls.isSprinting = true; break;
            case 'Space':
                if (controls.canJump) {
                    bodyPhys.velocity.y = controls.jumpVelocity;
                    controls.canJump = false;
                    console.log('Jump triggered');
                }
                break;
            case 'KeyF':
                isFirstPerson = !isFirstPerson;
                console.log('Toggled to', isFirstPerson ? 'First-person' : 'Third-person');
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        console.log('Key released:', e.code);
        switch (e.code) {
            case 'KeyW':
            case 'KeyS': controls.velocity.z = 0; break;
            case 'KeyA':
            case 'KeyD': controls.velocity.x = 0; break;
            case 'ShiftLeft':
            case 'ShiftRight': controls.isSprinting = false; break;
        }
    });

    return {
        mesh: group,
        body: bodyPhys,
        isFirstPerson: () => isFirstPerson,
        update: (delta) => {
            // Calculate movement speed
            const currentSpeed = controls.isSprinting ? controls.sprintSpeed : controls.speed;

            // Normalize and scale velocity
            const velocity = controls.velocity.clone();
            if (velocity.length() > 0) {
                velocity.normalize();
                velocity.scale(currentSpeed, velocity); // In-place scaling
            }

            // Convert to THREE.Vector3 for rotation
            const threeVelocity = new THREE.Vector3(velocity.x, 0, velocity.z);

            // Convert CANNON.Quaternion to THREE.Quaternion
            const quaternion = new THREE.Quaternion(
                bodyPhys.quaternion.x,
                bodyPhys.quaternion.y,
                bodyPhys.quaternion.z,
                bodyPhys.quaternion.w
            );

            // Rotate velocity based on player's orientation
            threeVelocity.applyQuaternion(quaternion);

            // Apply to physics body
            bodyPhys.velocity.x = threeVelocity.x;
            bodyPhys.velocity.z = threeVelocity.z;
            console.log('Applied velocity:', { x: bodyPhys.velocity.x, z: bodyPhys.velocity.z });

            // Sync visual with physics
            group.position.copy(bodyPhys.position);
            group.quaternion.set(
                bodyPhys.quaternion.x,
                bodyPhys.quaternion.y,
                bodyPhys.quaternion.z,
                bodyPhys.quaternion.w
            ); // Sync rotation

            // Rotate based on mouse
            if (mouseX !== 0) {
                const rotationSpeed = 2.0; // Increased sensitivity
                bodyPhys.quaternion = new CANNON.Quaternion()
                    .setFromAxisAngle(new CANNON.Vec3(0, 1, 0), mouseX * rotationSpeed)
                    .mult(bodyPhys.quaternion); // Apply rotation
                mouseX = 0; // Reset after applying
            }

            // Update jump status
            if (bodyPhys.position.y <= 0.75 && bodyPhys.velocity.y <= 0) {
                controls.canJump = true;
            }

            TWEEN.update();
        }
    };
}