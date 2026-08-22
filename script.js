import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x020303);
scene.fog = new THREE.FogExp2(0x020303, 0.026);


const camera = new THREE.PerspectiveCamera(
  64,
  window.innerWidth / window.innerHeight,
  0.1,
  700
);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickablePhotos = [];

const textureLoader = new THREE.TextureLoader();

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(1);

function renderSize() {

  const height = 240;

  const width =
    Math.round(
      height *
      window.innerWidth /
      window.innerHeight
    );

  renderer.setSize(
    width,
    height,
    false
  );
}

renderSize();

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

function typePhrase(text, display, speed = 50) {

  display.textContent = '';
  display.style.display = 'block';

  let index = 0;

  const interval = setInterval(() => {

    display.textContent += text[index];

    index++;

    if (index >= text.length) {
      clearInterval(interval);

      setTimeout(() => {
        display.style.display = 'none';
      }, 2000);
    }

  }, speed);
}


function updateMousePosition(event) {

  const rect =
    renderer.domElement.getBoundingClientRect();

  mouse.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  mouse.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleSceneInteraction(event) {

  // Pointer lock has no meaningful cursor position. Interact through the
  // on-screen crosshair instead of a stale mouse-event coordinate.
  if (controls.isLocked) {
    mouse.set(0, 0);
  } else {
    updateMousePosition(event);
  }

raycaster.setFromCamera(mouse, camera);

  const hits =
    raycaster.intersectObjects(
      clickablePhotos,
      false
    );

  console.log('CLICK');
  console.log('HITS:', hits.length);

  if (hits.length === 0) {
    console.log('NOTHING CLICKED');
    controls.lock();
    return;
  }

  const clickedObject =
    hits[0].object;

  const clickedPhoto =
    clickedObject.userData.photo ||
    clickedObject;

  console.log('CLICKED PHOTO:', clickedPhoto);
  console.log('PHOTO DATA:', clickedPhoto.userData);


  // KEYPAD
  if (clickedObject.userData.type === 'keypad') {

    keypadScreen.style.display = 'flex';

    controls.unlock();

    return;
  }

// PHRASE
    if (clickedPhoto.userData.phrase) {

    console.log(
      'PHRASE:',
      clickedPhoto.userData.phrase
    );

    const phraseDisplay =
      document.getElementById('photo-phrase');

    typePhrase(
      clickedPhoto.userData.phrase,
      phraseDisplay,
      50
    );

    return;
    }

  if (clickedPhoto.userData.type === 'wall-photo') {
    wallPhotoClick.currentTime = 0;
    wallPhotoClick.play().catch((error) => {
      console.warn('Unable to play wall-photo sound:', error);
    });
  }

  // NUMBER
  if (
    clickedPhoto.userData.number !== null &&
    clickedPhoto.userData.number !== undefined
  ) {

    console.log(
      'NUMBER:',
      clickedPhoto.userData.number
    );

    const numberDisplay =
      document.getElementById('photo-number');

    numberDisplay.textContent =
      clickedPhoto.userData.number;

    numberDisplay.style.display =
      'block';

    setTimeout(() => {
      numberDisplay.style.display =
        'none';
    }, 2000);

    return;
  }

}

renderer.domElement.addEventListener('click', handleSceneInteraction);

document.querySelector('#experience').prepend(renderer.domElement);


// LIGHTING
scene.add(
  new THREE.HemisphereLight(
    0xbcdde0,
    0x293d2b,
    2.7
  )
);

const sun = new THREE.DirectionalLight(
  0xfff1d5,
  3.1
);

sun.position.set(70, 110, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);

scene.add(sun);


// CONTROLS
const controls = new PointerLockControls(
  camera,
  renderer.domElement
);

const keys = new Set();
const collisionObjects = [];

// MOBILE CONTROLS

let mobileMoveX = 0;
let mobileMoveY = 0;

let joystickTouchId = null;

const joystick =
  document.getElementById('joystick');

const joystickKnob =
  document.getElementById('joystick-knob');

const lookArea =
  document.getElementById('look-area');

let lookTouchId = null;

let lastLookX = 0;
let lastLookY = 0;
let lookMoved = false;
const mobileLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');

// MOBILE JOYSTICK

joystick.addEventListener(
  'touchstart',
  (event) => {

    event.preventDefault();

    const touch =
      event.changedTouches[0];

    joystickTouchId =
      touch.identifier;

    updateJoystick(touch);

  },
  { passive: false }
);


joystick.addEventListener(
  'touchmove',
  (event) => {

    event.preventDefault();

    for (const touch of event.changedTouches) {

      if (
        touch.identifier ===
        joystickTouchId
      ) {
        updateJoystick(touch);
      }

    }

  },
  { passive: false }
);


joystick.addEventListener(
  'touchend',
  (event) => {

    for (const touch of event.changedTouches) {

      if (
        touch.identifier ===
        joystickTouchId
      ) {

        joystickTouchId = null;

        mobileMoveX = 0;
        mobileMoveY = 0;

        joystickKnob.style.transform =
          'translate(-50%, -50%)';

      }

    }

  }
);


function updateJoystick(touch) {

  const rect =
    joystick.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let x =
    touch.clientX - centerX;

  let y =
    touch.clientY - centerY;

  const radius =
    rect.width / 2;

  const distance =
    Math.sqrt(
      x * x + y * y
    );

  if (distance > radius) {

    x =
      (x / distance) * radius;

    y =
      (y / distance) * radius;

  }

  mobileMoveX =
    x / radius;

  mobileMoveY =
    y / radius;

  joystickKnob.style.transform =
    `translate(
      calc(-50% + ${x}px),
      calc(-50% + ${y}px)
    )`;

}

// MOBILE LOOK

lookArea.addEventListener(
  'touchstart',
  (event) => {

    event.preventDefault();

    const touch =
      event.changedTouches[0];

    lookTouchId =
      touch.identifier;

    lastLookX =
      touch.clientX;

    lastLookY =
      touch.clientY;

    lookMoved = false;

  },
  { passive: false }
);


lookArea.addEventListener(
  'touchmove',
  (event) => {

    event.preventDefault();

    for (const touch of event.changedTouches) {

      if (
        touch.identifier !==
        lookTouchId
      ) {
        continue;
      }

      const deltaX =
        touch.clientX - lastLookX;

      const deltaY =
        touch.clientY - lastLookY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        lookMoved = true;
      }

      lastLookX =
        touch.clientX;

      lastLookY =
        touch.clientY;

      const sensitivity = 0.003;

      mobileLookEuler.setFromQuaternion(camera.quaternion);
      mobileLookEuler.y -= deltaX * sensitivity;
      mobileLookEuler.x -= deltaY * sensitivity;
      mobileLookEuler.x =
        THREE.MathUtils.clamp(
          mobileLookEuler.x,
          -Math.PI / 2,
          Math.PI / 2
        );
      camera.quaternion.setFromEuler(mobileLookEuler);

    }

  },
  { passive: false }
);

lookArea.addEventListener(
  'touchend',
  (event) => {

    for (const touch of event.changedTouches) {
      if (touch.identifier !== lookTouchId) {
        continue;
      }

      if (!lookMoved) {
        handleSceneInteraction(touch);
      }

      break;
    }

    lookTouchId = null;
    lookMoved = false;

  },
  { passive: false }
);
let worldBounds = new THREE.Box3(
  new THREE.Vector3(-40, -5, -40),
  new THREE.Vector3(40, 30, 40)
);

let groundY = 0;

const clock = new THREE.Clock();

// INTRO SCREEN
const introScreen =
  document.getElementById('intro-screen');

const enterButton =
  document.getElementById('enter-button');
const loadingScreen =
  document.getElementById('loading-screen');
const siteAudio =
  document.getElementById('site-audio');
const footstepSounds = [
  new Audio('/footstep-wood.wav'),
  new Audio('/footstep-concrete.wav')
];

const accessDenied = new Audio('/accessDenied.mp3')
const accessGranted = new Audio('/accessGranted.mp3');
const endingTypingSound = new Audio('/ending-typing.wav');
const wallPhotoClick = new Audio('/wall-photo-click.wav');
const keypadPressSounds = [
  new Audio('/keypad-beep-3.wav'),
  new Audio('/keypad-beep-4.wav')
];

wallPhotoClick.preload = 'auto';
wallPhotoClick.volume = 0.5;
endingTypingSound.preload = 'auto';
endingTypingSound.volume = 0.5;
keypadPressSounds.forEach((sound) => {
  sound.preload = 'auto';
  sound.volume = 0.5;
});

let keypadPressSoundIndex = 0;

function playKeypadPressSound() {
  const sound = keypadPressSounds[keypadPressSoundIndex];
  keypadPressSoundIndex =
    (keypadPressSoundIndex + 1) % keypadPressSounds.length;

  sound.currentTime = 0;
  sound.play().catch((error) => {
    console.warn('Unable to play keypad button sound:', error);
  });
}

footstepSounds.forEach((sound) => {
  sound.preload = 'auto';
  sound.volume = 0.38;
});

let footstepIndex = 0;
let footstepTimer = 0;
let worldLoaded = false;
let loadingRequested = false;

function hideLoadingScreen() {
  loadingScreen.classList.remove('visible');
  loadingRequested = false;
}

enterButton.addEventListener('click', (event) => {

  event.stopPropagation();

  introScreen.style.display = 'none';
  introScreen.style.pointerEvents = 'none';
  loadingScreen.classList.add('visible');
  loadingRequested = true;

  if (worldLoaded) {
    setTimeout(hideLoadingScreen, 350);
  }

  // Starting from this user interaction satisfies browser autoplay rules.
  siteAudio.play().catch((error) => {
    console.warn('Unable to start site audio:', error);
  });

  if (!('ontouchstart' in window)) {
  controls.lock();
}

});


// KEYBOARD
window.addEventListener('keydown', (event) => {
  if (
    [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ShiftLeft',
      'ShiftRight'
    ].includes(event.code)
  ) {
    keys.add(event.code);
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});


// Add Keypad
function addKeypad(position, rotation, width) {

  textureLoader.load('/EverbloomWebP/keypad.webp', (texture) => {

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    const image = texture.image;
    const height =
      width * (image.height / image.width);

    const geometry =
      new THREE.PlaneGeometry(width, height);

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

    const keypad =
      new THREE.Mesh(geometry, material);

    keypad.position.copy(position);
    keypad.rotation.copy(rotation);

    keypad.userData.type = 'keypad';

    scene.add(keypad);

    // The whole visible keypad plane is its clickable area.
    clickablePhotos.push(keypad);
  });
}

//Add Wall Photos
function addWallPhoto(
  imagePath,
  position,
  rotation,
  width,
  number = null,
  horizontal = false,
  phrase = null
) {

  textureLoader.load(imagePath, (texture) => {

    // Pixelated texture settings
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    const image = texture.image;

    const aspect =
      image && image.width
        ? image.height / image.width
        : 1;

    const height = width * aspect;

    // VISIBLE PHOTO
    const geometry = new THREE.PlaneGeometry(
      width,
      height
    );

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

    const photo =
      new THREE.Mesh(
        geometry,
        material
      );

    photo.position.set(
      position.x,
      position.y,
      position.z
    );

    photo.rotation.set(
      rotation.x,
      rotation.y,
      rotation.z
    );

    photo.userData.number = number;
    photo.userData.phrase = phrase;
    photo.userData.type = 'wall-photo';

    scene.add(photo);

    // A PlaneGeometry raycasts over its complete rectangular surface,
    // regardless of the photo's orientation or the browser viewport size.
    clickablePhotos.push(photo);

    console.log(
      'CLICKABLE PHOTO:',
      imagePath,
      'NUMBER:',
      number,
      'PHRASE:',
      phrase
    );

  });
}

// KEYPAD
let enteredCode = '';

const keypadScreen =
  document.getElementById('keypad-screen');

const keypadDisplay =
  document.getElementById('keypad-display');

const keypadMessage =
  document.getElementById('keypad-message');

const keypadBack =
  document.getElementById('keypad-back');

const keypadButtons =
  document.querySelectorAll('#keypad-buttons button');

const CORRECT_CODE = '1030';
const accessGrantedFlash =
  document.getElementById('access-granted-flash');
const pixelTransition =
  document.getElementById('pixel-transition');
const endingScreen =
  document.getElementById('ending-screen');
const endingText =
  document.getElementById('ending-text');
const endingVideo =
  document.getElementById('ending-video');
const unlockPanel =
  document.getElementById('unlockPanel');
const emailForm =
  document.getElementById('emailForm');
const emailInput =
  document.getElementById('emailInput');
const skipEmailButton =
  document.getElementById('skipEmailButton');

let endingStarted = false;

const getVideoEmbed = () => {
  const origin =
    window.location.origin && window.location.origin !== 'null'
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';

  return `<iframe width="560" height="315" src="https://www.youtube.com/embed/UH79ndc72wg?si=-YRHa6XEPAsJf1kh${origin}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="origin" allowfullscreen></iframe>`;
};

const isValidEmail = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

function updateKeypadDisplay() {
  keypadDisplay.textContent = enteredCode;
}

function typeEndingMessage() {
  const message = 'You have broken the cycle of doubt';
  let index = 0;

  endingText.textContent = '';
  endingTypingSound.currentTime = 0;
  endingTypingSound.play().catch((error) => {
    console.warn('Unable to play ending typing sound:', error);
  });

  const interval = setInterval(() => {
    endingText.textContent += message[index];
    index++;

    if (index >= message.length) {
      clearInterval(interval);
      endingTypingSound.pause();
      endingTypingSound.currentTime = 0;
      setTimeout(() => {
        unlockPanel.hidden = false;
        emailInput.focus();
      }, 500);
    }
  }, 55);
}

function showUnlockedVideo() {
  unlockPanel.hidden = true;
  endingVideo.innerHTML =
    `<h2>check your email</h2><p>(remember to check your spam)</p>${getVideoEmbed()}`;
  endingVideo.hidden = false;
}

emailForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    emailInput.value = '';
    emailInput.focus();
    alert('Please enter a valid email address.');
    return;
  }

  const submitButton = emailForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'SENDING...';

  fetch('/.netlify/functions/submit-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Email submission failed.');
      }
    })
    .then(() => {
      siteAudio.pause();
      showUnlockedVideo();
    })
    .catch((error) => {
      console.error(error);
      submitButton.disabled = false;
      submitButton.textContent = 'UNLOCK';
      alert('Failed to send. Please try again.');
    });
});

skipEmailButton.addEventListener('click', showUnlockedVideo);

function beginEndingSequence() {
  if (endingStarted) {
    return;
  }

  endingStarted = true;
  keypadButtons.forEach((button) => {
    button.disabled = true;
  });

  accessGrantedFlash.classList.remove('flash');
  void accessGrantedFlash.offsetWidth;
  accessGrantedFlash.classList.add('flash');

  setTimeout(() => {
    keypadScreen.style.display = 'none';
    controls.unlock();

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 384; index++) {
      const pixel = document.createElement('span');
      pixel.className = 'ending-pixel';
      pixel.style.setProperty(
        '--pixel-delay',
        `${Math.random() * 0.42}s`
      );
      fragment.appendChild(pixel);
    }
    pixelTransition.replaceChildren(fragment);
    pixelTransition.classList.add('active');

    setTimeout(() => {
      endingScreen.classList.add('visible');
      typeEndingMessage();
    }, 900);
  }, 2000);
}

keypadButtons.forEach((button) => {

  button.addEventListener('click', () => {

    const key = button.dataset.key;
    playKeypadPressSound();

    // NUMBER
    if (/^[0-9]$/.test(key)) {

      if (enteredCode.length < 12) {
        enteredCode += key;
      }

      keypadMessage.textContent = '';
      updateKeypadDisplay();

    }

    // BACKSPACE
    else if (key === 'backspace') {

      enteredCode =
        enteredCode.slice(0, -1);

      keypadMessage.textContent = '';
      updateKeypadDisplay();

    }

    // ENTER
    else if (key === 'enter') {

      if (enteredCode === CORRECT_CODE) {

        keypadMessage.textContent =
          'ACCESS GRANTED';

        console.log('CORRECT CODE');
        accessGranted.currentTime = 0;
        accessGranted.play().catch((error) => {
          console.warn('Unable to play access-granted sound:', error);
        });
        beginEndingSequence();
} else {

  keypadMessage.textContent =
    'INCORRECT CODE';

  console.log('INCORRECT CODE');

  accessDenied.currentTime = 0;
  accessDenied.play().catch((error) => {
    console.warn('Unable to play access-denied sound:', error);
  });

  enteredCode = '';

  updateKeypadDisplay();

  const flash =
    document.getElementById('wrong-pin-flash');

  const keypadPanel =
    document.getElementById('keypad-panel');

  // Red flash
  flash.classList.remove('flash');

  void flash.offsetWidth;

  flash.classList.add('flash');

  // Shake keypad
  keypadPanel.classList.remove('shake');

  void keypadPanel.offsetWidth;

  keypadPanel.classList.add('shake');

}

    }

  });

});


// BACK BUTTON
keypadBack.addEventListener('click', () => {

  keypadScreen.style.display = 'none';

  enteredCode = '';

  updateKeypadDisplay();

  keypadMessage.textContent = '';

  controls.lock();

});


// LOAD WORLD
function enterWorld(model) {

  model.traverse((node) => {

     // Collision objects
  if (
    node.name.startsWith('Wall_Collision') ||
    node.name.startsWith('Rope_Collision') ||
    node.name === 'Cube002' ||
    node.name === 'Cube003' ||
    node.name === 'Cube004'
  ) {

    collisionObjects.push(node);

    console.log('COLLISION OBJECT:', node.name);
  }
     if (!node.isMesh) return;

  if (node.isSkinnedMesh) {
    node.userData.phrase = "i'm so tired";
    clickablePhotos.push(node);
  }

  const box = new THREE.Box3().setFromObject(node);
  const size = box.getSize(new THREE.Vector3());

 // Hide collision geometry but keep it available for collision detection
  if (
     node.name === 'Wall_Collision_01' ||
      node.name === 'Wall_Collision_02' ||
    node.name === 'Rope_Collision'
  ) {
    node.visible = false;
  }

    if (node.name === 'Rope_Collision_02') {
  collisionObjects.push(node);

  node.visible = true;

  if (node.material) {
    node.material.color.set(0x000000);
  }
}
  
    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];

    materials
      .filter(Boolean)
      .forEach((material) => {

        if (material.map) {

          material.map.magFilter = THREE.NearestFilter;
          material.map.minFilter = THREE.NearestFilter;
          material.map.generateMipmaps = false;
          material.map.needsUpdate = true;
        }

        material.flatShading = true;
        material.needsUpdate = true;

      });

  });


  // CENTER WORLD
  const rawBounds = new THREE.Box3().setFromObject(model);

  const center = rawBounds.getCenter(
    new THREE.Vector3()
  );

  model.position.sub(
    center.multiply(
      new THREE.Vector3(1, 0, 1)
    )
  );


  scene.add(model);
// WALL ART

addWallPhoto(
  '/EverbloomWebP/reggie_final.webp',
  new THREE.Vector3(-1.8, 1, 13.9),
  new THREE.Euler(0, Math.PI / 2, 0),
  0.5,
  1
);

addWallPhoto(
  '/EverbloomWebP/tlod_01.webp',
  new THREE.Vector3(2.58, 1.13, 13.9),
  new THREE.Euler(0, Math.PI / 2, 0),
  0.5,
  0
);

addWallPhoto(
  '/EverbloomWebP/if_thoughts_finals.webp',
  new THREE.Vector3(0.4, 2.19999, 3),
  new THREE.Euler(Math.PI / 2, 0, 0),
  0.5,
  3,
  true
);

addWallPhoto(
  '/EverbloomWebP/vacant_rooms-alt_artwork.webp',
  new THREE.Vector3(2.3, 0.01, 2),
  new THREE.Euler(-Math.PI / 2, 0, 0),
  0.5,
  0,
  true
);

const scratchPhoto = addWallPhoto(
  '/EverbloomWebP/scratch_txt.webp',
  new THREE.Vector3(2.58, 0.6, 6),
  new THREE.Euler(0, -Math.PI / 2, 0),
  0.65,
  null,
  false,
  'though i pulled at the strings that bind, you have left me behind reaching fruitless for your soul'
);

addKeypad(
  new THREE.Vector3(-1.87, 0.8, 2),
  new THREE.Euler(0, Math.PI / 2, 0),
  0.18
);

  // WORLD BOUNDS
  worldBounds = new THREE.Box3().setFromObject(model);

  groundY = 0;

  const size = worldBounds.getSize(
    new THREE.Vector3()
  );

  console.log("BOUNDS MIN:", worldBounds.min);
  console.log("BOUNDS MAX:", worldBounds.max);
  console.log("MODEL POS:", model.position);
  console.log("GROUND Y:", groundY);
  console.log("SIZE:", size);


 
  // PLAYER SPAWN
const PLAYER_HEIGHT = 0.8;

camera.position.set(
  0,
  groundY + PLAYER_HEIGHT,
  10

);


  console.log('EVERBLOOM WORLD LOADED');
}


// GLTF LOADER
const loader = new GLTFLoader();

loader.setMeshoptDecoder(
  MeshoptDecoder
);

loader.load(

  'https://pub-c676e45a87984f2a958af49283fdda36.r2.dev/everbloomRender.glb',

  (gltf) => {

    enterWorld(gltf.scene);
    worldLoaded = true;

    if (loadingRequested) {
      setTimeout(hideLoadingScreen, 350);
    }

  },

  (xhr) => {

    if (xhr.total) {

      console.log(
        'Loading:',
        Math.round(
          (xhr.loaded / xhr.total) * 100
        ) + '%'
      );

    }

  },

  (error) => {

    console.error(
      'GLB loading error:',
      error
    );

  }

);


// MOVEMENT
function collidesAt(position) {

  const playerSize = new THREE.Vector3(
    0.8,
    1.6,
    0.8
  );

  const halfSize = playerSize
    .clone()
    .multiplyScalar(0.5);

  const playerBox = new THREE.Box3(
    position.clone().sub(halfSize),
    position.clone().add(halfSize)
  );

  for (const object of collisionObjects) {

    const collisionBox = new THREE.Box3()
      .setFromObject(object);

    if (playerBox.intersectsBox(collisionBox)) {
      return true;
    }

  }

  return false;
}
function movePlayer(delta) {

  if (!controls.isLocked && mobileMoveX === 0 && mobileMoveY === 0) {
  updateFootsteps(delta, false);
  return;
}

  const speed =
    (
      keys.has('ShiftLeft') ||
      keys.has('ShiftRight')
    )
      ? 12
      : 5;

  const movement = speed * delta;

const oldPosition = camera.position.clone();

// DESKTOP WASD
if (keys.has('KeyW')) {
  controls.moveForward(movement);
}

if (keys.has('KeyS')) {
  controls.moveForward(-movement);
}

if (keys.has('KeyA')) {
  controls.moveRight(-movement);
}

if (keys.has('KeyD')) {
  controls.moveRight(movement);
}

// MOBILE JOYSTICK
if (mobileMoveY < -0.15) {
  controls.moveForward(
    movement * -mobileMoveY
  );
}

if (mobileMoveY > 0.15) {
  controls.moveForward(
    -movement * mobileMoveY
  );
}

if (mobileMoveX < -0.15) {
  controls.moveRight(
    -movement * -mobileMoveX
  );
}

if (mobileMoveX > 0.15) {
  controls.moveRight(
    movement * mobileMoveX
  );
}

// COLLISION
if (collidesAt(camera.position)) {
  camera.position.copy(oldPosition);
}
  const position = camera.position;
  const padding = 0.8;

  position.x = THREE.MathUtils.clamp(
    position.x,
    worldBounds.min.x + padding,
    worldBounds.max.x - padding
  );

  position.z = THREE.MathUtils.clamp(
    position.z,
    worldBounds.min.z + padding,
    worldBounds.max.z - padding
  );

  // Keep the player's height consistent while moving
  const PLAYER_HEIGHT = 0.8;
  position.y = groundY + PLAYER_HEIGHT;

  const moved = oldPosition.distanceToSquared(camera.position) > 0.000001;
  updateFootsteps(delta, moved);
}

function updateFootsteps(delta, isMoving) {
  if (!isMoving) {
    footstepTimer = 0;
    return;
  }

  footstepTimer -= delta;
  if (footstepTimer > 0) {
    return;
  }

  const sound = footstepSounds[footstepIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});

  footstepIndex = (footstepIndex + 1) % footstepSounds.length;
  footstepTimer =
    (keys.has('ShiftLeft') || keys.has('ShiftRight'))
      ? 0.28
      : 0.42;
}

// RESIZE
window.addEventListener('resize', () => {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderSize();

});


// LOOP
function animate() {

  requestAnimationFrame(animate);

  const delta =
    Math.min(
      clock.getDelta(),
      0.1
    );

  movePlayer(delta);

  renderer.render(
    scene,
    camera
  );

}

animate();
