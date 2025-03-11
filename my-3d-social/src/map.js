import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function initMap(scene, world) {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 10
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to align with visual ground
    groundBody.position.set(0, 0, 0);
    world.addBody(groundBody);

    // Cyberpunk buildings (unchanged for now)
    const buildingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 50
    });

    for (let i = 0; i < 20; i++) {
        const height = Math.random() * 10 + 5;
        const width = Math.random() * 4 + 2;
        const buildingGeo = new THREE.BoxGeometry(width, height, width);
        const building = new THREE.Mesh(buildingGeo, buildingMaterial);
        building.position.set(
            Math.random() * 80 - 40,
            height / 2,
            Math.random() * 80 - 40
        );
        building.castShadow = true;
        scene.add(building);

        const buildingBody = new CANNON.Body({
            mass: 0, // Static
            shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, width / 2))
        });
        buildingBody.position.copy(building.position);
        world.addBody(buildingBody);
    }

    // Fog for cyberpunk atmosphere
    scene.fog = new THREE.FogExp2(0x112233, 0.02);
}