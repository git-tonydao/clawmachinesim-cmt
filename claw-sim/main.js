import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.11.2/rapier.es.js";

let scene, camera, renderer;
let world;
let clawMesh;
let prizes = [];
let dropping = false;

await RAPIER.init();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202030);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 12, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  // Physics world
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  // Floor
  const floorGeo = new THREE.BoxGeometry(20, 1, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.y = -0.5;
  scene.add(floorMesh);

  const floorBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed()
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(10, 0.5, 10),
    floorBody
  );

  // Claw
  const clawGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const clawMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  clawMesh = new THREE.Mesh(clawGeo, clawMat);
  clawMesh.position.set(0, 8, 0);
  scene.add(clawMesh);

  // Create prizes
  for (let i = 0; i < 8; i++) {
    createPrize(
      (Math.random() - 0.5) * 6,
      2 + i,
      (Math.random() - 0.5) * 6
    );
  }

  setupControls();
}

function createPrize(x, y, z) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff99 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z)
  );

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.2),
    body
  );

  prizes.push({ mesh, body });
}

function setupControls() {
  document.getElementById("left").onclick = () => move(-0.5, 0);
  document.getElementById("right").onclick = () => move(0.5, 0);
  document.getElementById("forward").onclick = () => move(0, -0.5);
  document.getElementById("back").onclick = () => move(0, 0.5);
  document.getElementById("drop").onclick = dropClaw;

  window.addEventListener("keydown", (e) => {
    if (dropping) return;

    if (e.key === "ArrowLeft") move(-0.5, 0);
    if (e.key === "ArrowRight") move(0.5, 0);
    if (e.key === "ArrowUp") move(0, -0.5);
    if (e.key === "ArrowDown") move(0, 0.5);
    if (e.key === " ") dropClaw();
  });
}

function move(dx, dz) {
  clawMesh.position.x += dx;
  clawMesh.position.z += dz;
}

function dropClaw() {
  if (dropping) return;
  dropping = true;
}

function animate() {
  requestAnimationFrame(animate);

  world.step();

  // Update prize meshes
  prizes.forEach((p) => {
    const pos = p.body.translation();
    p.mesh.position.set(pos.x, pos.y, pos.z);
  });

  // Claw drop logic
  if (dropping) {
    clawMesh.position.y -= 0.15;

    if (clawMesh.position.y <= 1) {
      // Lift back up
      clawMesh.position.y = 8;
      dropping = false;
    }
  }

  renderer.render(scene, camera);
}
