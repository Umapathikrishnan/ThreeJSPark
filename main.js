import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
// scene config
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -(size.width / size.height) * 50,
  (size.width / size.height) * 50,
  50,
  -50,
  1,
  500
);

// const camera = new THREE.PerspectiveCamera(
//   75,
//   size.width / size.height,
//   0.1,
//   1000
// );
camera.position.z = -67;
camera.position.y = 39;
camera.position.x = -13;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: document.querySelector("#bg"),
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = 3;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

//create sphere to make it interactive on click add name
const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(10, 5, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
sphere.name = "interactiveSphere";
sphere.material.metalness = 0.5;
sphere.material.roughness = 0.2;

scene.add(sphere);

const loader = new GLTFLoader();
let character = {
  instanceof: null,
  jumpHeight: 2,
  moveDistance: 3,
  targetRotation: 0,
  moveDuration: 250,
  isMoving: false,
};
// Optional: Provide a DRACOLoader instance to decode compressed mesh data
loader.load(
  "./ThreeJSSitev1.glb",
  function (glb) {
    // Add the loaded scene to your Three.js scene
    glb.scene.traverse(function (child) {
      console.log(child.name);
      if (child.name === "Plane002") {
        character.instanceof = child;
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(glb.scene);
  },
  undefined, // Optional: A function to track loading progress
  function (error) {
    console.error("An error occurred while loading the model:", error);
  }
);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
sunLight.castShadow = true;
sunLight.target.position.set(0, 0, 0);
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.normalBias = 0.1;
sunLight.shadow.mapSize.width = 496;
sunLight.shadow.mapSize.height = 496;

// const shadowHelper = new THREE.CameraHelper(sunLight.shadow.camera);
// scene.add(shadowHelper);

sunLight.position.set(75, 80, 0);
scene.add(sunLight);
const color = 0xfefefe;
const intensity = 1.3;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);
document.body.appendChild(renderer.domElement);
// camera.set(-13, 60, 100);
camera.position.x = -110;
camera.position.y = 30;
camera.position.z = 38;
camera.zoom = 1.3;

camera.lookAt(new THREE.Vector3(0, 0, 0));

function onWindowResize() {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  camera.aspect = size.width / size.height;
  camera.left = -(size.width / size.height) * 50;
  camera.right = (size.width / size.height) * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
}
addEventListener("resize", onWindowResize, false);

function onPointerMove(event) {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
const modal = document.getElementById("modal");
function renderRayCast() {
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    // intersects[i].object.material.color.set(0xff0000);
    if (intersects[i].object.name === "interactiveSphere") {
      //open modal on click
      document.body.style.cursor = "pointer";
      modal.style.display = "block";
    }
  }
}
// closeModal

function moveCharacter(targetPosition, targetRotation) {
  character.isMoving = true;

  const t1 = gsap.to(character.instanceof.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: character.moveDuration / 1000,
    ease: "power1.inOut",
    onComplete: () => {
      character.isMoving = false;
    },
  });
  const t2 = gsap.to(
    character.instanceof.rotation,
    {
      y: targetRotation,
      duration: character.moveDuration / 1000,
      ease: "power1.inOut",
    },
    0
  );
  // jump tween
  const t3 = gsap.to(character.instanceof.position, {
    y: character.instanceof.position.y + character.jumpHeight,
    duration: character.moveDuration / 2000,
    ease: "power1.out",
    yoyo: true,
    repeat: 1,
  });
}

// on keydown asdw move character
document.addEventListener("keydown", (event) => {
  if (character.isMoving) return;
  let targetPosition = new THREE.Vector3().copy(character.instanceof.position);
  let targetRotation = 0;
  switch (event.key) {
    case "a":
    case "arrowleft":
      targetPosition.z -= character.moveDistance;
      targetRotation = Math.PI;
      break;
    case "d":
    case "arrowright":
      targetPosition.z += character.moveDistance;
      targetRotation = 0;
      break;
    case "w":
    case "arrowup":
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI / 2;
      break;
    case "s":
    case "arrowdown":
      targetPosition.x -= character.moveDistance;
      targetRotation = -Math.PI / 2;
      break;
    default:
      break;
  }
  moveCharacter(targetPosition, targetRotation);
});

const closeModal = document.getElementById("closeModal");
closeModal.onclick = function () {
  modal.style.display = "none";
  document.body.style.cursor = "default";
};
window.addEventListener("pointermove", onPointerMove);

//controls -orbit
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.update();

// animation loop
function animate() {
  onWindowResize();
  renderRayCast();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
