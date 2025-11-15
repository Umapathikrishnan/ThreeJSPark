import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// detect mobile
const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
if (isMobile) {
  document.getElementById("mobileControls").classList.remove("hidden");
}

// Load jump sound
const jumpSound = new Audio("./assets/jump.mp3");
jumpSound.volume = 0.1; // adjust volume

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

camera.position.z = -67;
camera.position.y = 39;
camera.position.x = -13;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = 3;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const loader = new GLTFLoader();
let character = {
  instanceof: null,
  jumpHeight: 2,
  moveDistance: 3,
  targetRotation: 0,
  moveDuration: 250,
  isMoving: false,
};

let infoObject;

new GLTFLoader();
loader.load("./assets/chatBubble.glb", function (glb) {
  infoObject = glb.scene;
  infoObject.name = "chatBubble";
  infoObject.position.set(10, 20, 0);
  infoObject.rotation.x = Math.PI / 2; // modified to face camera

  infoObject.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.name = "chatBubble";
      child.material.metalness = 0.3;
      child.material.roughness = 0.7;
    }
  });
  gsap.to(infoObject.rotation, {
    z: "+=6.283", // 2π = 360°
    duration: 6,
    ease: "none",
    repeat: -1,
  });

  gsap.to(infoObject.scale, {
    x: 1.15,
    y: 1.15,
    z: 1.15,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "power1.inOut",
  });

  // Optional float animation
  gsap.to(infoObject.position, {
    y: infoObject.position.y + 1.5,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  scene.add(infoObject);
});

// Optional: Provide a DRACOLoader instance to decode compressed mesh data
loader.load(
  "./assets/park.glb",
  function (glb) {
    // Add the loaded scene to your Three.js scene
    glb.scene.traverse(function (child) {
      console.log(child.name);
      if (child.name === "Plane002") {
        character.instanceof = child;
        character.instanceof.position.y -= 3.5; // My character initial position adjustment
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
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

function mobileMove(dir) {
  if (!character.isMoving) {
    let targetPosition = new THREE.Vector3().copy(
      character.instanceof.position
    );
    let targetRotation = 0;

    if (dir === "up") {
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI / 2;
    }
    if (dir === "down") {
      targetPosition.x -= character.moveDistance;
      targetRotation = -Math.PI / 2;
    }
    if (dir === "left") {
      targetPosition.z -= character.moveDistance;
      targetRotation = Math.PI;
    }
    if (dir === "right") {
      targetPosition.z += character.moveDistance;
      targetRotation = 0;
    }

    moveCharacter(targetPosition, targetRotation);
  }
}

// attach events
btnUp.addEventListener("touchstart", () => mobileMove("up"));
btnDown.addEventListener("touchstart", () => mobileMove("down"));
btnLeft.addEventListener("touchstart", () => mobileMove("left"));
btnRight.addEventListener("touchstart", () => mobileMove("right"));

const modal = document.getElementById("modal");
let hoveringSphere = false;

function renderRayCast() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let sphereHovered = false;

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === "chatBubble") {
      sphereHovered = true;

      if (!hoveringSphere) {
        hoveringSphere = true;
        document.body.style.cursor = "pointer";

        // OPEN MODAL
        modal.classList.remove("hidden");
        modal.classList.add("visible");
      }
    }
  }

  // restore cursor (but DO NOT close modal)
  if (!sphereHovered) {
    document.body.style.cursor = "default";
  }
}

// closeModal

function moveCharacter(targetPosition, targetRotation) {
  character.isMoving = true;

  jumpSound.currentTime = 0;
  jumpSound.play();
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
  switch (event.key.toLowerCase()) {
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
  }

  moveCharacter(targetPosition, targetRotation);
});

closeModal.onclick = function () {
  modal.classList.add("hidden");
  modal.classList.remove("visible");
  hoveringSphere = false; // reset so hover can open again
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
