import './style.css';
import * as THREE from 'three';
import { initPlayer } from './player.js';
import { initMap } from './map.js';
import { initInterface } from './interface.js';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Initialize components
const player = initPlayer(scene, camera, world, renderer); // Pass renderer
initMap(scene, world);
const ui = initInterface(scene, camera, renderer);

camera.position.set(0, 5, 10);

// Animation loop
let lastTime = 0;
function animate(time) {
  requestAnimationFrame(animate);

  const delta = (time - lastTime) / 1000;
  lastTime = time;

  world.step(1 / 60, delta);
  player.update(delta);
  ui.update();

  // Update camera position based on mode
  if (player.isFirstPerson()) {
    // First-person: Camera at player's head
    camera.position.copy(player.mesh.position);
    camera.position.y += 1.2; // Head height
    camera.rotation.copy(player.mesh.rotation);
  } else {
    // Third-person: Camera follows behind player
    const offset = new THREE.Vector3(0, 2, 5);
    offset.applyQuaternion(player.mesh.quaternion); // Use mesh quaternion
    camera.position.lerp(
      player.mesh.position.clone().add(offset),
      0.1
    );
    camera.lookAt(player.mesh.position);
  }

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});