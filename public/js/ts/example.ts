// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

THREE.Cache.enabled = true;

//THREE.Cache.enabled = true;
import { rotateEffect, Effect, hoverEffect } from "./effects.js";
import { FPSMultiplatformControls } from "./fps-multiplatform-controls.js";
import {
  CANNONVec,
  copyMeshRot,
  copyMeshTransform,
  copyBodyTransform,
} from "./utils.js";
import { TouchEventHandler } from "../touch-event-handler.js";
import { GLTFLoader } from "../../libs/threejs/GLTFLoader.js";
var width, height;
var viewAngle = 45,
  near = 1,
  far = 10000;
var aspect;

const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;

var renderer: THREE.WebGLRenderer,
  composer,
  camera: THREE.PerspectiveCamera,
  uiCam: THREE.OrthographicCamera,
  scene: THREE.Scene,
  uiScene: THREE.Scene,
  controls: FPSMultiplatformControls,
  clock,
  world: CANNON.World,
  physicsBodies: { body: CANNON.Body; mesh: THREE.Object3D }[],
  playerBody: CANNON.Body,
  effects: Effect[],
  container: JQuery<HTMLElement>;
var sceneObject, intersected;
var bloomPass;

const audioListener = new THREE.AudioListener();
let sounds = [];

let touchEventHandler;
var pacControls;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const playerHeight = 2.7;
const playerSpeed = 50;
const jumpSpeed = 10;
const gravity = 20;
const deceleration = 10;

export const PLAYER_GROUP = 1;
export const STATIC_GROUP = 2;
export const DYNAMIC_GROUP = 4;

const loadingManager = new THREE.LoadingManager(() => {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.classList.add("fade-out");

  // optional: remove loader from DOM via event listener
  loadingScreen.addEventListener("transitionend", onTransitionEnd);
});

function onTransitionEnd(event) {
  event.target.remove();
}

$(function () {});

export function startScene() {
  //
  if (!window.Detector.webgl) window.Detector.addGetWebGLMessage();

  console.log("starting scene");

  var container = $("#container_3d");
  // startScene(container);

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
  clock = new THREE.Clock();
  world = new CANNON.World();
  world.gravity.set(0, -9, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  physicsBodies = [];
  sounds = [];

  const rotAxis = new THREE.Vector3(0, 0, 1);
  effects = [];

  const audioLoader = new THREE.AudioLoader(loadingManager);
  const loader = new GLTFLoader(loadingManager);
  if (window.previewGLTF) {
    console.log("Loading preview!");
    loader.parse(window.previewGLTF, loader.resourcePath, onGLTFLoad);

    var stopPreviewBtn = document.getElementById("stopPreviewButton");
    if (stopPreviewBtn) {
      stopPreviewBtn.style.display = "block";
    }
  } else {
    console.log("loading from server..");
    loader.load(
      "https://storage.googleapis.com/oakley-drop/scene.gltf",
      onGLTFLoad
    );
    // loader.setPath
    // loader.load('model/scene.gltf', onGLTFLoad);
  }

  function onGLTFLoad(gltf) {
    console.log("on gltf load");
    scene.add(gltf.scene);

    // Materials
    var defaultMat = new CANNON.Material("defaultMat");

    // Adjust constraint equation parameters for ground/ground contact
    var default_default_cm = new CANNON.ContactMaterial(
      defaultMat,
      defaultMat,
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

    scene.traverse(function (obj: THREE.Object3D) {
      console.log(obj);
      var body;
      if (obj.name == "Player") {
        playerBody = new CANNON.Body({
          mass: 1, // kg
          position: CANNONVec(obj.position), // m
          shape: new CANNON.Sphere(playerHeight),
          material: defaultMat,
          // linearDamping: .5
        });
        playerBody.fixedRotation = true;
        playerBody.updateMassProperties();
        playerBody.addEventListener("collide", function (e) {
          console.log(e, " pos: ", playerBody.position);
        });

        playerBody.collisionFilterGroup = PLAYER_GROUP;
        playerBody.collisionFilterMask = STATIC_GROUP | DYNAMIC_GROUP;

        body = playerBody;
      } else if (obj.userData.boxCollider) {
        console.log("adding box collider");

        var center = new THREE.Vector3();
        var size = new THREE.Vector3();
        var bbox = new THREE.Box3().setFromObject(obj);
        bbox.getCenter(center);
        bbox.getSize(size);
        size.multiplyScalar(0.5);

        body = new CANNON.Body({
          mass: 0, // kg
          position: CANNONVec(center), // m
          shape: new CANNON.Box(CANNONVec(size)),
          material: defaultMat,
        });

        body.collisionFilterGroup = STATIC_GROUP;
        body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;

        body.type = CANNON.Body.STATIC;
      } else if (obj.userData.meshCollider) {
        console.log("adding physics object");

        body = new CANNON.Body({
          mass: 1, // kg
          position: CANNONVec(obj.position), // m
          shape: new CANNON.Sphere(0.3),
          material: defaultMat,
          // linearDamping: .5
        });

        body.collisionFilterGroup = DYNAMIC_GROUP;
        body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;
      }

      if (obj.userData.invisible) {
        obj.visible = false;
      }

      if (obj.userData.rotate) {
        // rotateObjects.push(obj);

        effects.push(rotateEffect(obj, 0.07, rotAxis));
      }

      if (obj.userData.hover) {
        // rotateObjects.push(obj);
        effects.push(hoverEffect(obj, 0.09, 0.1, rotAxis));
      }

      if (obj.userData.soundEffect) {
        // load a sound and set it as the PositionalAudio object's buffer
        const sound = new THREE.PositionalAudio(audioListener);
        sound.loop = true;
        audioLoader.load(
          "sounds/" + obj.userData.soundEffect + ".ogg",
          function (buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(1);
            sounds.push(sound);
            obj.add(sound);
          }
        );
      }

      if (body) {
        world.addBody(body);
        physicsBodies.push({ body: body, mesh: obj });
      }
    });

    camera = gltf.cameras[0];
    camera.far = 300;
    camera.updateProjectionMatrix();
    copyMeshTransform(playerBody, camera);

    camera.add(audioListener);

    addLights();

    // rotateObjects.forEach((obj)=>{
    // 	const objParent = createParentAtCenter(obj);
    // 	effects.push(rotateEffect(objParent,.1,rotAxis));
    // });

    const startButton = document.getElementById("start-button");
    startButton.addEventListener("click", startGame);
  }

  function addLights() {
    // Lights
    var ambient = new THREE.AmbientLight(0x6b6b6b);
    scene.add(ambient);
  }
}

function addControls() {
  touchEventHandler = new TouchEventHandler(document);
  controls = new FPSMultiplatformControls(
    camera,
    playerBody,
    world,
    document.body,
    touchEventHandler
  );
  controls.playerHeight = playerHeight;

  scene.add(controls.getObject());

  // pacControls = new THREE.PointAndClickControls(camera, playerBody, uiScene, uiCam, touchEventHandler);

  document.body.addEventListener("click", function () {
    if (controls.pointerLock.isLocked) {
      controls.pointerLock.unlock();
    } else {
      controls.pointerLock.lock();
    }
  });
}

function createRenderer() {
  console.log("creating renderer");
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.append(renderer.domElement);

  // @ts-ignore
  const renderScene = new THREE.RenderPass(scene, camera);
  const bloomParams = {
    exposure: 0.5,
    bloomStrength: 0.5,
    bloomThreshold: 0.5,
    bloomRadius: 0.7,
  };
  // @ts-ignore
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;
  // @ts-ignore
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.setSize(width, height);
}

function startGame() {
  console.log("starting game");
  const overlay = document.getElementById("start-screen");
  overlay.remove();

  addControls();

  createRenderer();

  $(window).on("resize", onWindowResize);
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

  if (controls) {
    controls.update(delta);
  }

  world.step(fixedTimeStep, delta, maxSubSteps);

  for (let i = 0; i < physicsBodies.length; i++) {
    copyBodyTransform(physicsBodies[i].body, physicsBodies[i].mesh);
  }

  effects.forEach((effect) => effect.update(delta));

  composer.render();
}

function onWindowResize() {
  var rect = document.documentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;

  console.log("on window resize! ", width, ",", height);
  aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  uiCam.left = -1;
  uiCam.right = 1;
  uiCam.top = 1 / aspect;
  uiCam.bottom = -1 / aspect;
  uiCam.updateProjectionMatrix();

  // pacControls.resize(aspect);

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

/* Get the element you want displayed in fullscreen mode (a video in this example): */
// var elem = document.getElementById("container");

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
