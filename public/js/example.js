
// import * as THREE from 'three';
// import { GLTFLoader } from './libs/threejs/GLTFLoader.js';

var width, height;
var viewAngle = 45,
	near = 1,
	far = 10000;
var aspect;

var renderer, camera, scene, controls;
var sceneObject, intersected;


$(function () {

	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var container = $("#container_3d");
	startScene(container);
	
});




function startScene(container) {

	width = window.innerWidth;
	height = window.innerHeight;
	aspect = width / height;

	scene = new THREE.Scene();

	const loader = new THREE.GLTFLoader().setPath( 'model/' );
	loader.load( 'scene.gltf', function ( gltf ) {

		scene.add( gltf.scene );
		camera = gltf.cameras[0];
		addLights();
		onWindowResize();
		addControls();
		animate();

	} );

	// Load models
	// var loader = new THREE.SceneLoader();

	// loader.load("model/newscene.json", function (e) {
	// 	scene = e.scene;
	// 	// sceneObject = object;
	// 	// console.log(sceneObject);
	// 	sceneObject.scale.set(13, 13, 13);
	// 	sceneObject.position.set(0, 0, 0);
	// 	scene.add(sceneObject);

	// 	var axes = new THREE.AxisHelper(700);
	// 	scene.add(axes);

	// 	addLights();
	// 	// addControls();

	// 	animate();
	// });

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
		// Controls
		var options = {
			speedFactor: 0.04,
			delta: 1,
			rotationFactor: 0.002,
			maxPitch: 55,
			hitTest: true,
			hitTestDistance: 40
		};
		// var pos = camera.position;
		
		// camera.position.set(0,0,0);
		// camera.quaternion.identity();
		controls = new TouchControls(container.parent(), camera, options);
		// controls.setPosition(pos);
		controls.addToScene(scene);
		// controls.setRotation(0.15, -0.15);
	}

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	container.append(renderer.domElement);

	$(window).on("resize", onWindowResize);

	$(document.body).on("touchmove", function (event) {
		event.preventDefault();
		event.stopPropagation();
	});


}

function animate() {

	requestAnimationFrame(animate);

	if(controls) {
		controls.update();

		// Mouse hit-testing:
		var vector = new THREE.Vector3(controls.mouse.x, controls.mouse.y, 1);
		vector.unproject(camera);
	
		var raycaster = new THREE.Raycaster(controls.fpsBody.position, vector.sub(controls.fpsBody.position).normalize());
	
		var intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			if (intersected != intersects[0].object) {
				if (intersected) intersected.material.emissive.setHex(intersected.currentHex);
				intersected = intersects[0].object;
				// console.log(intersects);
				intersected.currentHex = intersected.material.emissive.getHex();
				intersected.material.emissive.setHex(0xdd0090);
			}
		} else {
			if (intersected) intersected.material.emissive.setHex(intersected.currentHex);
			intersected = null;
		}
	}

	renderer.render(scene, camera);
	// window.scrollTo(0, 200);
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

  var goFS = document.getElementById('goFS');
  goFS.addEventListener(
    'click',
    function () {
      document.body.requestFullscreen();
    },
    false,
  );