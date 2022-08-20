
// import * as THREE from 'three';
// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

var width, height;
var viewAngle = 45,
	near = 1,
	far = 10000;
var aspect;

const fixedTimeStep = 1.0 / 60.0; // seconds
const maxSubSteps = 3;

var renderer, camera, scene, controls, clock, world, physicsBodies;
var sceneObject, intersected;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const playerHeight = .3;
const playerSpeed = 50;
const jumpSpeed = 10;
const gravity = 20;
const deceleration = 10;

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
	clock = new THREE.Clock();

	world = new CANNON.World();
	world.gravity.set(0, -9, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	physicsBodies = [];

	const loader = new THREE.GLTFLoader().setPath('model/');
	if(window.previewGLTF) {
		console.log("Loading preview!");
		loader.parse(window.previewGLTF, loader.resourcePath, onGLTFLoad)
	}else {
		console.log("loading from disk..");
		loader.load('scene.gltf', onGLTFLoad);
	}

	function onGLTFLoad(gltf) {

		scene.add(gltf.scene);

		scene.traverse(function (obj) {
			if (obj.userData.boxCollider) {
				console.log("adding box collider");

				var center = new THREE.Vector3();
				var size = new THREE.Vector3();
				var bbox = new THREE.Box3().setFromObject(obj);
				bbox.getCenter(center);
				bbox.getSize(size);

				var body = new CANNON.Body({
					mass: 1, // kg
					position: CANNONVec(center), // m
					shape: new CANNON.Box(CANNONVec(size)),
					linearDamping: .5
				});

				body.type = CANNON.Body.STATIC;

				world.addBody(body);

				physicsBodies.push({ body: body, mesh: obj })
			}
			if (obj.userData.meshCollider) {
				console.log("adding physics object");

				var sphereBody = new CANNON.Body({
					mass: 1, // kg
					position: CANNONVec(obj.position), // m
					shape: new CANNON.Sphere(1),
					linearDamping: .5
				});

				world.addBody(sphereBody);

				physicsBodies.push({ body: sphereBody, mesh: obj })
			}
		});

		camera = gltf.cameras[0];
		addLights();
		onWindowResize();
		addControls();
		animate();
	}

	function addLights() {
		// Lights
		var ambient = new THREE.AmbientLight(0x404040);
		scene.add(ambient);

		var light1 = new THREE.PointLight(0xffffff);
		light1.position.set(0, 2000, 750);
		light1.intensity = 0.45;
		//light1.castShadow = true;
		scene.add(light1);

		var light2 = new THREE.PointLight(0xFFFFFF);
		light2.position.set(5, 100, -200);
		light2.intensity = 0.4;
		scene.add(light2);
	}

	function addControls() {
		// Camera
		camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
		camera.position.set(0, .3, -5);
		camera.lookAt(new THREE.Vector3(0, .3, 0));
		// Controls
		var options = {
			speedFactor: 0.04,
			delta: 1,
			rotationFactor: 0.002,
			maxPitch: 55,
			hitTest: true,
			hitTestDistance: 40
		};

		controls = new THREE.FPSMultiplatformControls(camera, document.body);

		scene.add(controls.getObject());

		document.body.addEventListener('click', function () {
			if (controls.pointerLock.isLocked) {
				controls.pointerLock.unlock();
			} else {
				controls.pointerLock.lock();
			}
		});
	}

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	container.append(renderer.domElement);

	$(window).on("resize", onWindowResize);
}

function animate() {

	requestAnimationFrame(animate);

	const delta = clock.getDelta();

	world.step(fixedTimeStep, delta, maxSubSteps);

	for (let i = 0; i < physicsBodies.length; i++) {
		updateMeshTransform(physicsBodies[i].body, physicsBodies[i].mesh);
	}

	if (controls) {
		controls.update(delta);
	}

	renderer.render(scene, camera);
}

function onWindowResize() {

	width = window.innerWidth;
	height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
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
