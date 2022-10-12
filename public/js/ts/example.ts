// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

import { rotateEffect, Effect, hoverEffect, bloomModEffect, shoeEffect } from "./effects.js";
import { FPSMultiplatformControls } from "./fps-multiplatform-controls.js";
import { JoystickControls } from "./joystick/JoystickControls.js";
import { threeToCannon, ShapeType } from './three-to-cannon/src/index.js';
import { OcclusionZones } from './occlusion-zones.js';
import { AudioSource3D, AudioListener3D } from './Audio3D.js';

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

var audioMap: { elementId: string, pos: THREE.Vector3 }[] = [
  {
    elementId: "lab-audio",
    pos: new THREE.Vector3(-.5, 0, 25)
  },
  {
    elementId: "sandal-audio",
    pos: new THREE.Vector3(-27, .6, -23)
  },
  {
    elementId: "flesh-audio",
    pos: new THREE.Vector3(23, .6, -29)
  },
  {
    elementId: "saw-audio",
    pos: new THREE.Vector3(29, .6, 19)
  },
]

type TextureMap = {
  [key in KnobKey]?: THREE.Texture;
};

var loadedTextures: TextureMap = {};

interface ZoneDef {
  zoneName: string,
  bounds: THREE.Box3,
  objNames: string[]
}

var occlusionZoneDefs: ZoneDef[] = [
  {
    zoneName: "sandal",
    bounds: new THREE.Box3(new THREE.Vector3(-50, -27, -45), new THREE.Vector3(-10, 40, 7)),
    objNames: [
      "sandal_dome",
      "sandal_consoles",
      "vent_01_goodglb_2",
      "shoe_brown_sandalglb",
      "shoe_tan_sandalglb"
    ]
  },
  {
    zoneName: "flesh",
    bounds: new THREE.Box3(new THREE.Vector3(-8, -27, -46), new THREE.Vector3(40, 40, -13)),
    objNames: [
      "flesh_dome",
      "flesh_consoles",
      "shoe_flesh_militaryglb",
      "shoe_white_fleshglb",
      "shoe_flesh_blackglb",
    ]
  },
  {
    zoneName: "saw",
    bounds: new THREE.Box3(new THREE.Vector3(14, -27, -7), new THREE.Vector3(41, 40, 31)),
    objNames: [
      "saw_dome",
      "saw_console",
      "shoe_white_sawglb",
      "shoe_brown_sawglb",
    ]
  }
]
let occlusionZones = new OcclusionZones();
occlusionZoneDefs.forEach((zoneDef) => {
  occlusionZones.addZone(zoneDef.bounds, zoneDef.zoneName);
});

const shoeNames = [
  "shoe_brown_sawglb",
  "shoe_flesh_blackglb",
  "shoe_white_fleshglb",
  "shoe_flesh_militaryglb",
  "shoe_brown_sandalglb",
  "shoe_tan_sandalglb",
  "shoe_white_sawglb",
]

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
  // audioListener: THREE.AudioListener,
  effects: Effect[],
  audioElements: HTMLAudioElement[] = [],
  container: JQuery<HTMLElement>;

const physicsBodyMap = new Map<CANNON.Body, THREE.Object3D>();

var bloomPass;

let sounds = [];

let touchEventHandler;

const playerColliderWidth = .5;
const playerHeight = 2.6;

let sceneGltf;

const defaultCannonMat = new CANNON.Material("defaultMat");

let showingRotateNote = false;

export const PLAYER_GROUP = 1;
export const STATIC_GROUP = 2;
export const DYNAMIC_GROUP = 4;

const colliderTypeOverrides = {
  pCube19: ShapeType.HULL,
  pCube29: ShapeType.HULL,
  pCube6: ShapeType.HULL,
  pCube7: ShapeType.HULL,
  pCube9: ShapeType.HULL,
  pCube33: ShapeType.HULL,
  pCube34: ShapeType.HULL,
  polySurface52: undefined,
  pCube3: undefined,
  pCube4: undefined,
  pCube5: undefined,
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
  world.gravity.set(0, -19, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 3;

  dynamicPhysicsBodies = [];
  sounds = [];

  const hoverAxis = new THREE.Vector3(0, 1, 0);
  const rotAxis = new THREE.Vector3(0, 0, 1);
  effects = [];

  const loadingManager = new THREE.LoadingManager(onLoadingDone);

  const textureLoader = new THREE.TextureLoader(loadingManager);

  let lastProgressUpdate = 0;

  if (window.previewGLTF) {
    console.log("Loading preview!");
    const loader = new GLTFLoader();
    loader.parse(window.previewGLTF, loader.resourcePath, function (gltf) {
      onGLTFLoad(gltf);
    });

    var stopPreviewBtn = document.getElementById("stopPreviewButton");
    if (stopPreviewBtn) {
      stopPreviewBtn.style.display = "block";
    }
  } else {
    const loader = new GLTFLoader(loadingManager);
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
  }

  loadOtherAssets();

  function onGLTFLoad(gltf) {
    console.log("on gltf load!");
    sceneGltf = gltf;
  }

  function loadKnobs() {
    console.log('loading knobs');
    textureUrls.forEach((texUrl) => {
      textureLoader.load(texUrl.url, (tex) => {
        loadedTextures[texUrl.key] = tex;
      });
    });
  }

  function loadOtherAssets() {
    loadKnobs();
  }

  async function onLoadingDone() {
    // return;
    if (!sceneGltf) {
      console.log('awaiting scene gltf...');
    }
    while (true) {
      if (sceneGltf) {
        initScene();
        return;
      }
      await null;
    }
  }

  function initScene() {

    console.log("on loading done!");

    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");

    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener("transitionend", (event) => {
      //@ts-ignore
      event.target.remove();
    });

    // @ts-ignore
    if (window.IS_MOBILE && window.innerHeight > window.innerWidth) {
      const rotateNote = document.getElementById("rotate-note");
      rotateNote.style.display = "block";
      rotateNote.classList.add("fade-in");
      rotateNote.addEventListener("transitionend", (event) => {
        //@ts-ignore
        event.target.remove();
      });

      showingRotateNote = true;

      function checkForLandscape() {
        // @ts-ignore
        if (showingRotateNote && window.innerWidth > window.innerHeight) {
          rotateNote.classList.add("fade-out");
          rotateNote.addEventListener("transitionend", (event) => {
            //@ts-ignore
            event.target.remove();
            rotateNote.style.display = "none";
            showingRotateNote = false;
          });

          window.removeEventListener('resize', checkForLandscape);
        }
      }

      window.addEventListener('resize', checkForLandscape);
    }

    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener("transitionend", (event) => {
      //@ts-ignore
      event.target.remove();
    });


    scene.add(sceneGltf.scene);
    scene.updateWorldMatrix(true, true);

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
    let shoesObjs: THREE.Object3D[] = [];
    scene.traverse(function (obj: THREE.Object3D) {

      occlusionZoneDefs.forEach((zoneDef) => {
        zoneDef.objNames.forEach((objName) => {
          if (objName == obj.name) {
            console.log('adding ', obj.name, ' to zone: ', zoneDef.zoneName);
            occlusionZones.addObject(zoneDef.zoneName, obj);
          }
        })
      });

      shoeNames.forEach((shoeName) => {
        if (obj.name == shoeName) {
          shoesObjs.push(obj);
        }
      });

      var body;
      if (obj.name == "Player") {
        obj.position.y = .54;
        playerBody = new CANNON.Body({
          mass: 1, // kg
          position: CANNONVec(obj.position), // m
          shape: new CANNON.Sphere(playerColliderWidth),
          material: defaultCannonMat,
        });
        playerBody.fixedRotation = true;
        playerBody.updateMassProperties();

        // //@ts-ignore
        // if (window.IS_DEV_BUILD) {
        //   playerBody.addEventListener("collide", function (e) {
        //     const threeObj = physicsBodyMap.get(e.body);
        //     if (threeObj) {
        //       console.log("three onj: ", threeObj.name);
        //     } else {
        //       console.log("unknown collider ", playerBody.position)
        //     }
        //   });
        // }

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
        if (obj.name.includes('rotater_thing') || obj.name.includes('fan') || obj.name == 'Cylinder') {
          axis = hoverAxis;
        }
        let rps = .07;
        if (obj.name.includes('fan')) {
          rps = .4;
        } else if (obj.name == 'Cylinder') {
          rps = .006;
        }
        effects.push(rotateEffect(obj, rps, axis));
      }

      if (obj.userData.hover) {

        console.log('hovering ', obj.name)
        effects.push(hoverEffect(obj, 0.001, 0.1, hoverAxis));
      }

      if (body) {
        world.addBody(body);
        dynamicPhysicsBodies.push({ body: body, mesh: obj });
      }
    });

    blockersParents.forEach((parent) => {
      addColliders(parent);
    });

    shoesObjs.forEach((shoeObj) => {

      // const shoeParent = createParentAtCenter(shoeObj)
      // effects.push(shoeEffect(shoeParent, camera));
    })

    copyMeshTransform(playerBody, camera);

    addLights();

    const startButton = document.getElementById("start-button") as HTMLButtonElement;
    startButton.addEventListener("click", () => { startButton.disabled = true; });
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
        shapeType = ShapeType.BOX;
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

    console.log("adding ", type, " collider to ", obj.name);
    const result = threeToCannon(obj, { type: type });
    const body = new CANNON.Body({
      mass: 0, // kg
      material: defaultCannonMat,
    });
    body.addShape(result.shape, result.offset, result.orientation);
    // obj.quaternion.copy(originalRot);

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

    document.addEventListener('pointerlockchange', updateFocusWarningScreen);
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

  //@ts-ignore
  renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: !window.IS_MOBILE });
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMapping = THREE.CineonToneMapping;


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
    bloomThreshold: 0.55,
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

  effects.push(bloomModEffect(
    new THREE.Vector3(-28.1, 0, -2.829),
    camera,
    bloomPass,
    .3,
    .8,
    1.3,
    6.2));

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

function playAudio() {

  const listener = new AudioListener3D();

  camera.add(listener);

  audioMap.forEach((audioElement) => {
    const elem = document.getElementById(audioElement.elementId) as HTMLAudioElement;
    audioElements.push(elem);
    elem.play();

    const audio = new AudioSource3D(listener, elem);
    audio.position.copy(audioElement.pos);
    scene.add(audio);
  });

  //@ts-ignore
  if (window.IS_MOBILE) {
    document.addEventListener("visibilitychange", () => {
      console.log('visibility change');
      audioElements.forEach((elem) => {
        if (document.hidden) {
          elem.pause();
        } else {
          elem.play();
        }
      }
      )
    }, false);
  }
}

function startGame() {
  console.log("starting game");
  const overlay = document.getElementById("start-screen");
  overlay.classList.add("fade-out");
  overlay.addEventListener("transitionend", (event) => {
    //@ts-ignore
    event.target.remove();
  });

  updateFocusWarningScreen();

  addControls();

  $(window).on("resize", debounce(onWindowResize));

  onWindowResize();

  playAudio();

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

  occlusionZones.update(camera.position);
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
    const newJoyScale = (aspect > 1) ? 5 : 9;
    joystickCam.aspect = aspect;
    joystickCam.updateProjectionMatrix();

    leftJoystick.joystickScale = newJoyScale;
    leftJoystick.viewPos = getJoystickOffset(false);
    leftJoystick.onResize(width, height);

    rightJoystick.joystickScale = newJoyScale;
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
  const shouldShowFocusWarning = !window.IS_MOBILE && controls?.pointerLock.isLocked;// && !window.IS_DEV_BUILD;

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
