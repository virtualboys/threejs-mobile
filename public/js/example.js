
// import * as THREE from 'three';
// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

THREE.Cache.enabled = true;

var width, height;
var viewAngle = 45,
	near = 1,
	far = 10000;
var aspect;

const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;

var renderer, composer, camera, uiCam, scene, uiScene, controls, clock, world, physicsBodies, playerBody;
var sceneObject, intersected;
var bloomPass;

const touchEventHandler = new THREE.TouchEventHandler(document);
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

const PLAYER_GROUP = 1;
const STATIC_GROUP = 2;
const DYNAMIC_GROUP = 4;

$(function () {


});

function startScene() {
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var container = $("#container_3d");
	// startScene(container);

	width = window.innerWidth;
	height = window.innerHeight;
	aspect = width / height;

	scene = new THREE.Scene();
	uiScene = new THREE.Scene();
	uiCam = new THREE.OrthographicCamera(-1, 1, 1 / aspect, -1 / aspect, .01, 100);

	clock = new THREE.Clock();

	world = new CANNON.World();
	world.gravity.set(0, -9, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	physicsBodies = [];

	const loader = new THREE.GLTFLoader();
	if (window.previewGLTF) {
		console.log("Loading preview!");
		loader.parse(window.previewGLTF, loader.resourcePath, onGLTFLoad);

		var stopPreviewBtn = document.getElementById('stopPreviewButton');
		if (stopPreviewBtn) {
			stopPreviewBtn.style.display = "block";
		}
	} else {
		console.log("loading from server..");
		loader.load('https://storage.googleapis.com/oakley-drop/scene.gltf', onGLTFLoad);
		// loader.setPath
		// loader.load('model/scene.gltf', onGLTFLoad);
	}

	function onGLTFLoad(gltf) {

		scene.add(gltf.scene);

		// Materials
		var defaultMat = new CANNON.Material("defaultMat");

		// Adjust constraint equation parameters for ground/ground contact
		var default_default_cm = new CANNON.ContactMaterial(defaultMat, defaultMat, {
			friction: 0,
			restitution: 0,
			contactEquationStiffness: 1e8,
			contactEquationRelaxation: 3,
			frictionEquationStiffness: 1e8,
			frictionEquationRegularizationTime: 3,
		});

		// Add contact material to the world
		world.addContactMaterial(default_default_cm);

		scene.traverse(function (obj) {
			console.log(obj);
			var geom = "";
			if(obj.isLight) {
				console.log('is light!');
			}
			var body;
			if(obj.name == "reactor_1") {
				for(var i = 0; i < obj.geometry.attributes.position.array.length; i++) {
					geom += obj.geometry.attributes.position.array[i];
					geom += ",";
				}
				// obj.geometry.attributes.position.array.foreach(e => geom += e);
				console.log(geom);
			}
			if (obj.name == 'Player') {

				playerBody = new CANNON.Body({
					mass: 1, // kg
					position: CANNONVec(obj.position), // m
					shape: new CANNON.Sphere(playerHeight),
					material: defaultMat,
					// linearDamping: .5
				});
				playerBody.fixedRotation = true;
				playerBody.updateMassProperties();
				playerBody.addEventListener('collide', function (e) {
					console.log(e);
				});

				playerBody.collisionFilterGroup = PLAYER_GROUP;
				playerBody.collisionFilterMask = STATIC_GROUP | DYNAMIC_GROUP;

				body = playerBody;
			}
			else if (obj.userData.boxCollider) {
				console.log("adding box collider");

				var center = new THREE.Vector3();
				var size = new THREE.Vector3();
				var bbox = new THREE.Box3().setFromObject(obj);
				bbox.getCenter(center);
				bbox.getSize(size);
				size.multiplyScalar(.5);

				body = new CANNON.Body({
					mass: 0, // kg
					position: CANNONVec(center), // m
					shape: new CANNON.Box(CANNONVec(size)),
					material: defaultMat,
				});

				body.collisionFilterGroup = STATIC_GROUP;
				body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;

				body.type = CANNON.Body.STATIC;

			}
			else if (obj.userData.meshCollider) {
				console.log("adding physics object");

				body = new CANNON.Body({
					mass: 1, // kg
					position: CANNONVec(obj.position), // m
					shape: new CANNON.Sphere(.3),
					material: defaultMat,
					// linearDamping: .5
				});

				body.collisionFilterGroup = DYNAMIC_GROUP;
				body.collisionFilterMask = PLAYER_GROUP | STATIC_GROUP | DYNAMIC_GROUP;
			}

			if (body) {
				world.addBody(body);
				physicsBodies.push({ body: body, mesh: obj })
			}
		});

		camera = gltf.cameras[0];
		camera.far = 300;
		camera.updateProjectionMatrix();
		copyMeshTransform(playerBody, camera);
		addLights();

		addControls();

		createRenderer();

		$(window).on("resize", onWindowResize);
		onWindowResize();

		animate();
	}

	function addLights() {
		// Lights
		var ambient = new THREE.AmbientLight(0x6b6b6b);
		scene.add(ambient);

		// var light1 = new THREE.PointLight(0xffffff);
		// light1.position.set(0, 2000, 750);
		// light1.intensity = 0.45;
		// //light1.castShadow = true;
		// scene.add(light1);

		// var light2 = new THREE.PointLight(0xFFFFFF);
		// light2.position.set(5, 100, -200);
		// light2.intensity = 0.4;
		// scene.add(light2);
	}

	function addControls() {
		controls = new THREE.FPSMultiplatformControls(camera, playerBody, world, document.body, touchEventHandler);
		controls.playerHeight = playerHeight;

		scene.add(controls.getObject());

		// pacControls = new THREE.PointAndClickControls(camera, playerBody, uiScene, uiCam, touchEventHandler);

		document.body.addEventListener('click', function () {
			if (controls.pointerLock.isLocked) {
				controls.pointerLock.unlock();
			} else {
				controls.pointerLock.lock();
			}
		});


	}
}

function createRenderer() {

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.gammaOutput = true;
	renderer.gammaFactor = 2.2;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;

	// renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	container.append(renderer.domElement);
	
	const renderScene = new THREE.RenderPass( scene, camera );
	
	const bloomParams = {
		exposure: .5,
		bloomStrength: .5,
		bloomThreshold: .5,
		bloomRadius: .7
	};

	bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	bloomPass.threshold = bloomParams.bloomThreshold;
	bloomPass.strength = bloomParams.bloomStrength;
	bloomPass.radius = bloomParams.bloomRadius;

	composer = new THREE.EffectComposer( renderer );
	composer.addPass( renderScene );
	composer.addPass( bloomPass );
	composer.setSize(width, height);

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

	composer.render();
	//renderer.autoClear = true;
	// renderer.render(scene, camera);
	// renderer.autoClear = false;
	// renderer.clearDepth();
	// renderer.render(uiScene, uiCam);
}

function onWindowResize() {

	width = window.innerWidth;
	height = window.innerHeight;

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
	composer.setSize( width, height );
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
