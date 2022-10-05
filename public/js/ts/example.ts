// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

THREE.Cache.enabled = true;

//THREE.Cache.enabled = true;
import { rotateEffect, Effect, hoverEffect } from "./effects.js";
import { FPSMultiplatformControls } from "./fps-multiplatform-controls.js";
import { JoystickControls } from "./joystick/JoystickControls.js";
import { threeToCannon, ShapeType } from './three-to-cannon/src/index.js';

import {
  CANNONVec,
  copyMeshRot,
  copyMeshTransform,
  copyBodyTransform,
  debounce,
  createParentAtCenter,
  reparentKeepWorldPos,
} from "./utils.js";
import { TouchEventHandler } from "../touch-event-handler.js";
import { GLTFLoader } from "../../libs/threejs/GLTFLoader.js";
import { off } from "process";

const texturesPath = "../../textures/";

var width, height;
var viewAngle = 45,
  near = 1,
  far = 10000;
var aspect;
type KnobKey = "leftBase" | "leftKnob" | "rightBase" | "rightKnob"
var textureUrls: { url: string, key: KnobKey }[] = [
  {
    url: "../../textures/look_orb_background.png",
    key: "rightBase"
  },
  {
    url: "../../textures/look_orb.png",
    key: "rightKnob"
  },
  {
    url: "../../textures/move_orb_background.png",
    key: "leftBase"
  },
  {
    url: "../../textures/move_orb.png",
    key: "leftKnob"
  }
]

type AudioMap = {
  [key in AudioKey]?: AudioBuffer;
};
type AudioKey = "labAmbience";
var audioUrls: { url: string, key: AudioKey }[] = [
  {
    url: "../../audio/labAmbience.mp3",
    key: "labAmbience"
  },
]
type TextureMap = {
  [key in KnobKey]?: THREE.Texture;
};

var loadedTextures: TextureMap = {};
var loadedAudio: AudioMap = {};

const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;

var renderer: THREE.WebGLRenderer,
  composer,
  fxaaPass,
  camera: THREE.PerspectiveCamera,
  joystickCam: THREE.PerspectiveCamera,
  uiCam: THREE.OrthographicCamera,
  scene: THREE.Scene,
  uiScene: THREE.Scene,
  controls: FPSMultiplatformControls,
  leftJoystick: JoystickControls,
  rightJoystick: JoystickControls,
  clock,
  world: CANNON.World,
  dynamicPhysicsBodies: { body: CANNON.Body; mesh: THREE.Object3D }[],
  playerBody: CANNON.Body,
  effects: Effect[],
  container: JQuery<HTMLElement>;

const physicsBodyMap = new Map<CANNON.Body, THREE.Object3D>();

var sceneObject, intersected;
var bloomPass;

const audioListener = new THREE.AudioListener();
let sounds = [];

let touchEventHandler;
// var pacControls;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const playerColliderWidth = .5;
const playerHeight = 2.6;

let sceneGltf, waterNormals, skyCubeMap;

const defaultCannonMat = new CANNON.Material("defaultMat");

export const PLAYER_GROUP = 1;
export const STATIC_GROUP = 2;
export const DYNAMIC_GROUP = 4;

const colliderTypeOverrides = {
  pCube19: ShapeType.HULL,
  pCube29: ShapeType.HULL,
  pCube6: ShapeType.HULL,
  pCube7: ShapeType.HULL,
  pCube9: ShapeType.HULL,
  polySurface52: undefined,
  pCube3: undefined,
  pCube4: undefined,
  pCube5: undefined,
}

const audioObjects = {
  tree_rotater: "labAmbience",
  PointLight_4: "labAmbience",
  flesh_black: "labAmbience",
}

$(function () { });

export function startScene() {
  //
  if (!window.Detector.webgl) window.Detector.addGetWebGLMessage();

  console.log("starting scene");

  container = $("#container_3d");

  //@ts-ignore
  const loadingBar = document.getElementById('loading-bar');

  width = window.innerWidth;
  height = window.innerHeight;
  aspect = width / height;

  scene = new THREE.Scene();

  uiScene = new THREE.Scene();
  uiCam = new THREE.OrthographicCamera(
    -1,
    1,
    1 / aspect,
    -1 / aspect,
    0.01,
    100
  );
  joystickCam = new THREE.PerspectiveCamera(45, width / height, .1, 100);

  clock = new THREE.Clock();
  world = new CANNON.World();
  world.gravity.set(0, -9, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 3;

  dynamicPhysicsBodies = [];
  sounds = [];

  const hoverAxis = new THREE.Vector3(0, 1, 0);
  const rotAxis = new THREE.Vector3(0, 0, 1);
  effects = [];

  const loadingManager = new THREE.LoadingManager(() => {
    onLoadingDone();

    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");

    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener("transitionend", onTransitionEnd);
  });

  function onTransitionEnd(event) {
    event.target.remove();
  }

  const audioLoader = new THREE.AudioLoader(loadingManager);
  const textureLoader = new THREE.TextureLoader(loadingManager);

  const loader = new GLTFLoader(loadingManager);

  let lastProgressUpdate = 0;
  if (window.previewGLTF) {
    console.log("Loading preview!");
    loader.parse(window.previewGLTF, loader.resourcePath, function (gltf) {
      onGLTFLoad(gltf);
      loadOtherAssets();
    });

    var stopPreviewBtn = document.getElementById("stopPreviewButton");
    if (stopPreviewBtn) {
      stopPreviewBtn.style.display = "block";
    }
  } else {
    //@ts-ignore
    const gltfURL = window.GLTF_URL
    console.log("loading from server.. ", gltfURL);
    loader.load(
      gltfURL,
      onGLTFLoad,
      function (xhr) {
        //@ts-ignore
        if (loadingBar.ldBar) {
          let progress = xhr.loaded / xhr.total * 100;
          //@ts-ignore
          loadingBar.ldBar.set(progress)
          if (progress - lastProgressUpdate > 10) {
            console.log(progress + '% loaded');
            lastProgressUpdate = progress;
          }
        }
      },
      function (error) {
        console.log('An error happened loading the gltf!!');
        console.log(error);
      }
    );
    loadOtherAssets();
  }

  function onGLTFLoad(gltf) {
    console.log("on gltf load!");
    sceneGltf = gltf;
  }

  async function loadKnobs() {
    const texturePromises = textureUrls.map(({ url }) => textureLoader.loadAsync(url));
    const textures = await Promise.all(texturePromises);
    loadedTextures = textures.reduce((textureMap, texture, index) => {
      const newKey = textureUrls[index].key;
      return { ...textureMap, [newKey]: texture }
    }, {})
  }

  async function loadAudio() {
    console.log('loading audio...');
    const promises = audioUrls.map(({ url }) => audioLoader.loadAsync(url));
    const audios = await Promise.all(promises);
    console.log('audio loaded');
    loadedAudio = audios.reduce((AudioMap, audio, index) => {
      const newKey = audioUrls[index].key;
      return { ...AudioMap, [newKey]: audio }
    }, {})
  }

  function loadOtherAssets() {
    loadKnobs();
    loadAudio();
  }

  function onLoadingDone() {

    console.log("on loading done!");
    scene.add(sceneGltf.scene);

    camera = sceneGltf.cameras[0];
    camera.far = 100;
    camera.updateProjectionMatrix();

    createRenderer();

    // Adjust constraint equation parameters for ground/ground contact
    var default_default_cm = new CANNON.ContactMaterial(
      defaultCannonMat,
      defaultCannonMat,
      {
        friction: 0,
        restitution: 0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRelaxation: 3,
      }
    );

    // Add contact material to the world
    world.addContactMaterial(default_default_cm);

    let blockersParents: THREE.Object3D[] = [];
    scene.traverse(function (obj: THREE.Object3D) {

      var body;
      if (obj.name == "Player") {
        playerBody = new CANNON.Body({
          mass: 1, // kg
          position: CANNONVec(obj.position), // m
          shape: new CANNON.Sphere(playerColliderWidth),
          material: defaultCannonMat,
        });
        playerBody.fixedRotation = true;
        playerBody.updateMassProperties();

        //@ts-ignore
        if (window.IS_DEV_BUILD) {
          playerBody.addEventListener("collide", function (e) {
            const threeObj = physicsBodyMap.get(e.body);
            if (threeObj) {
              console.log("three onj: ", threeObj.name);
            } else {
              console.log("unknown collider ", playerBody.position)
            }
          });
        }

        playerBody.collisionFilterGroup = PLAYER_GROUP;
        playerBody.collisionFilterMask = STATIC_GROUP | DYNAMIC_GROUP;

        body = playerBody;
      } else if (obj.userData.boxCollider) {

        body = createStaticCollider(obj, ShapeType.BOX);

      } else if (obj.userData.meshCollider) {
        console.log("adding physics object");

        body = new CANNON.Body({
          mass: 1, // kg
          position: CANNONVec(obj.position), // m
          shape: new CANNON.Sphere(0.3),
          material: defaultCannonMat,
          // linearDamping: .5
        });

        body.collisionFilterGroup = DYNAMIC_GROUP;
        body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;
      }

      if (obj.name == "blockers" || obj.name == "new_blockers") {
        blockersParents.push(obj);
      }

      if (obj.userData.invisible) {
        obj.visible = false;
      }

      if (obj.userData.rotate || obj.name.includes('fan')) {
        console.log('rotating ', obj.name)
        let axis = rotAxis;
        if(obj.name.includes('rotater_thing') || obj.name.includes('fan') || obj.name == 'Cylinder') {
          axis = hoverAxis;
        }
        let rps = .07;
        if(obj.name.includes('fan')) {
          rps = .4;
        } else if(obj.name == 'Cylinder') {
          rps = .006;
        }
        effects.push(rotateEffect(obj, rps, axis));
        // if(!obj.name.includes("tree")) {
        // effects.push(hoverEffect(obj, 0.001, 0.1, hoverAxis));
        // }
      }

      if(obj.userData.hover) {

        console.log('hovering ', obj.name)
        effects.push(hoverEffect(obj, 0.001, 0.1, hoverAxis));
      }

      if (obj.name in audioObjects) {
        console.log('adding sound effect to ', obj.name);
        // load a sound and set it as the PositionalAudio object's buffer
        const sound = new THREE.PositionalAudio(audioListener);
        sound.loop = true;
        sound.setBuffer(loadedAudio.labAmbience);
        sound.setRefDistance(2);
        obj.add(sound);
        sounds.push(sound);
      }

      if (obj.userData.soundEffect) {
        console.log('adding sound effect to ', obj.name);
        // load a sound and set it as the PositionalAudio object's buffer
        const sound = new THREE.PositionalAudio(audioListener);
        sound.loop = true;
        sound.setBuffer(loadedAudio.labAmbience);
        sound.setRefDistance(1);
        obj.add(sound);
        sounds.push(sound);
      }

      if (body) {
        world.addBody(body);
        dynamicPhysicsBodies.push({ body: body, mesh: obj });
      }
    });

    blockersParents.forEach((parent) => {
      addColliders(parent);
    });

    copyMeshTransform(playerBody, camera);

    camera.add(audioListener);

    addLights();

    const startButton = document.getElementById("start-button");
    startButton.addEventListener("click", startGame);
  }

  function addLights() {
    // Lights
    var ambient = new THREE.AmbientLight(0x6b6b6b);
    scene.add(ambient);
  }

  function addColliders(blockersParent: THREE.Object3D) {
    console.log('adding colliders...');

    let cols: { obj: THREE.Object3D, type: ShapeType }[] = [];

    blockersParent.traverse((obj: THREE.Object3D) => {
      let shapeType: ShapeType;
      if (obj.name in colliderTypeOverrides) {
        // console.log('overriding! ', obj.name);
        shapeType = colliderTypeOverrides[obj.name];
      } else if (obj.name.includes('Cube')) {
        shapeType = ShapeType.HULL;
      } else if (obj.name.includes('Cylinder')) {
        shapeType = ShapeType.HULL;
      } else if (obj.name.includes('Hull')) {
        shapeType = ShapeType.HULL;
      }

      if (shapeType) {
        cols.push({ obj: obj, type: shapeType })
      }
    });

    const newParent = new THREE.Group();
    scene.add(newParent);

    cols.forEach((col) => {
      reparentKeepWorldPos(col.obj, newParent);
      const body = createStaticCollider(col.obj, col.type);
      world.addBody(body);
      physicsBodyMap.set(body, col.obj);

      col.obj.removeFromParent();
    });

    blockersParent.removeFromParent();
  }

  function createStaticCollider(obj: THREE.Object3D, type: ShapeType): CANNON.Body {

    // console.log("adding ", type, " collider to ", obj.name);

    const result = threeToCannon(obj, { type: type });
    const body = new CANNON.Body({
      mass: 0, // kg
      material: defaultCannonMat,
    });
    body.addShape(result.shape, result.offset, result.orientation);
    copyMeshTransform(body, obj);

    // console.log('position:', body.position, ' size:', body.shapes[0].boundingSphereRadius);

    body.collisionFilterGroup = STATIC_GROUP;
    body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;

    body.type = CANNON.Body.STATIC;

    return body;
  }
}

function getJoystickOffset(isRight): THREE.Vector2 {
  const offset = new THREE.Vector2();
  offset.set(0, 1);

  if (isRight) {
    offset.x = 1 - offset.x;
  }

  return offset;
}

function addControls() {
  touchEventHandler = new TouchEventHandler(document);

  //@ts-ignore
  if (window.IS_MOBILE) {
    leftJoystick = new JoystickControls(
      joystickCam,
      uiScene,
      loadedTextures.leftBase,
      loadedTextures.leftKnob,
      getJoystickOffset(false),
      new THREE.Vector2(.6, .6),
      width,
      height);

    rightJoystick = new JoystickControls(
      joystickCam,
      uiScene,
      loadedTextures.rightBase,
      loadedTextures.rightKnob,
      getJoystickOffset(true),
      new THREE.Vector2(-.6, .6),
      width,
      height);
  } else {
    document.body.addEventListener("click", function () {
      if (controls.pointerLock.isLocked) {
        controls.pointerLock.unlock();
      } else {
        controls.pointerLock.lock();
      }
    });

    document.addEventListener( 'pointerlockchange', updateFocusWarningScreen );
  }

  controls = new FPSMultiplatformControls(
    camera,
    playerBody,
    world,
    document.body,
    touchEventHandler,
    leftJoystick,
    rightJoystick
  );
  controls.playerHeight = playerHeight;

  scene.add(controls.getObject());

  //@ts-ignore
  if (window.IS_DEV_BUILD) {
    controls.jumpEnabled = true;
    // controls.playerSpeed = 150;
  }

}

function createRenderer() {
  console.log("creating renderer");
  renderer = new THREE.WebGLRenderer({ antialias: false });
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMapping = THREE.CineonToneMapping;

  // const color = 0x000000;  // white
  // const near = 15;
  // const far = 50;
  // scene.fog = new THREE.Fog(color, near, far);

  renderer.setSize(width, height);
  container.append(renderer.domElement);

  // @ts-ignore
  const renderPass = new THREE.RenderPass(scene, camera);
  renderPass.clearColor = new THREE.Color(0, 0, 0);
  renderPass.clearAlpha = 0;
  renderPass.clearDepth = true;

  const bloomParams = {
    exposure: 0.5,
    bloomStrength: 0.5,
    bloomThreshold: 0.7,
    bloomRadius: 0.7,
  };
  // @ts-ignore
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;
  bloomPass.clear = true;

  //@ts-ignore
  window.BLOOMPASS = bloomPass;

  const pixelRatio = renderer.getPixelRatio();

  // @ts-ignore
  fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);

  // @ts-ignore
  const gammaCorrectionPass = new THREE.ShaderPass(THREE.GammaCorrectionShader);

  // @ts-ignore
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  // composer.addPass(fxaaPass);
  composer.addPass(bloomPass);
  composer.addPass(gammaCorrectionPass);

  composer.setSize(width, height);
}

function startGame() {
  console.log("starting game");
  const overlay = document.getElementById("start-screen");
  overlay.remove();

  updateFocusWarningScreen();

  addControls();

  $(window).on("resize", debounce(onWindowResize));
  // screen.orientation.addEventListener('change', onWindowResize);
  onWindowResize();

  sounds.forEach((sound) => {
    sound.play();
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  rightJoystick?.update((input) => {
    if (input) {
      controls.rotInputVec.set(-input.moveX, input.moveY);
    }
    else {
      controls.rotInputVec.set(0, 0);
    }
  });

  if (controls) {
    controls.update(delta);
  }
  world.step(fixedTimeStep, delta, maxSubSteps);

  for (let i = 0; i < dynamicPhysicsBodies.length; i++) {
    copyBodyTransform(dynamicPhysicsBodies[i].body, dynamicPhysicsBodies[i].mesh);
  }

  effects.forEach((effect) => effect.update(delta));

  camera.position.y += playerHeight;

  renderer.clear();
  // renderer.render(scene, camera);
  composer.render();
  renderer.clearDepth();
  renderer.render(uiScene, joystickCam);
}

function onWindowResize() {
  var rect = document.documentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;

  console.log("on window resize! ", width, ",", height);
  aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  if (leftJoystick) {
    joystickCam.aspect = aspect;
    joystickCam.updateProjectionMatrix();

    leftJoystick.viewPos = getJoystickOffset(false);
    leftJoystick.onResize(width, height);

    rightJoystick.viewPos = getJoystickOffset(true);
    rightJoystick.onResize(width, height);

    uiCam.left = -1;
    uiCam.right = 1;
    uiCam.top = 1 / aspect;
    uiCam.bottom = -1 / aspect;
    uiCam.updateProjectionMatrix();
  }

  // pacControls.resize(aspect);

  renderer.setSize(width, height);
  composer.setSize(width, height);

  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
}

function updateFocusWarningScreen() {
  //@ts-ignore
  const shouldShowFocusWarning = !window.IS_MOBILE && controls?.pointerLock.isLocked;

  const focusWarningScreen = document.getElementById('focus-warning-screen');
  focusWarningScreen.style.display = (shouldShowFocusWarning) ? 'block' : 'none';

  console.log('showing focus message: ', shouldShowFocusWarning);
}

function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;
  var cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}
